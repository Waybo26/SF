import { getSnowflakeConnection } from "@/lib/snowflake";
import type { SFFile } from "@/lib/sf-types";

// --- Result types ---

export interface AIAnalysisResult {
  verdict: "LIKELY_HUMAN" | "SUSPICIOUS" | "LIKELY_AI_ASSISTED";
  confidence: number;
  reasons: string[];
}

// --- System prompt ---

const SYSTEM_PROMPT = `You are an academic integrity analyst specializing in detecting AI-assisted or copy-pasted writing by analyzing behavioral writing session logs.

You will receive a complete .sf (ScribeFlow) file in JSON format. This file records every action a student took while writing an assignment in a monitored editor. Here is the structure:

## File Format

- **metadata**: Contains studentId, assignmentId, createdAt, and submittedAt timestamps.
- **events**: A chronological array of every action taken during the writing session. Event types include:
  - "keystroke": A single key press with the key character, cursor position, and timestamp.
  - "backspace": A backspace deletion with the deleted character, position, and timestamp.
  - "delete": A forward deletion with the deleted character, position, and timestamp.
  - "paste": Content pasted from clipboard, including the full pasted text, position, and character length.
  - "cut": Content cut from the editor, including the text, selection range (from/to), and timestamp.
  - "selection": When the student selects text, with the selection range (from/to) and timestamp.
  - "formatting": When the student applies formatting (bold, italic, underline, etc.), with the mark type, range, and timestamp.
  - "tab_away": When the student switches away from the editor tab. Only has a timestamp.
  - "tab_return": When the student returns to the editor tab, with the duration they were away (awayDuration in milliseconds).
  - "snapshot": A periodic or manual save point of the document, referencing a snapshotId.
- **snapshots**: An array of document snapshots, each with an id, label, timestamp, and the full HTML content of the document at that moment.

## What to Analyze

Examine the behavioral patterns in the events array to determine whether the student wrote the text themselves or copied/transcribed it from an external source (such as an AI tool on another tab, a pre-written document, or another screen).

Look for these specific indicators of suspicious behavior:

1. **Ghost text**: Large amounts of text in snapshots that cannot be accounted for by the keystroke events between snapshots. If the word count increases significantly but there are few corresponding keystroke events, the text likely came from somewhere other than typing in the editor.

2. **Low correction rate**: Real human writing involves frequent mistakes and corrections. Calculate the ratio of backspace/delete events to total keystroke events. A very low ratio (below ~5%) for a substantial piece of writing is unusual.

3. **Tab-away-then-type pattern**: Look for sequences where the student tabs away, returns, and then immediately produces fluent text with very few corrections. This pattern suggests reading from another source and transcribing.

4. **Unnatural typing bursts**: Look for clusters of rapid, evenly-spaced keystrokes with no pauses for thought. Natural writing has irregular rhythms with pauses for thinking, re-reading, and planning.

5. **Large paste events**: Check for paste events that contain substantial content (more than a sentence). While some pasting is normal (e.g., moving text around), large pastes of original content are suspicious.

6. **Low event-to-word ratio**: Compare the total number of events to the final word count. Natural writing typically generates many more events than words (due to corrections, selections, formatting, etc.). A ratio close to or below the character count suggests minimal editing.

7. **Timeline gaps**: Long periods of inactivity (visible as large timestamp gaps between events) followed by sudden bursts of content could indicate the student was composing text elsewhere.

8. **Writing progression**: Check how the document grew across snapshots. Natural writing shows incremental, non-linear growth with revisions. AI-assisted text tends to appear in large complete chunks.

## Response Format

You MUST respond with valid JSON only, no other text. Use this exact structure:

{
  "verdict": "LIKELY_HUMAN" | "SUSPICIOUS" | "LIKELY_AI_ASSISTED",
  "confidence": <number between 0.0 and 1.0>,
  "reasons": ["<specific finding 1>", "<specific finding 2>", ...]
}

Guidelines for verdict:
- "LIKELY_HUMAN": The behavioral patterns are consistent with natural human writing. There are normal correction rates, natural typing rhythms, and the text growth matches the event log.
- "SUSPICIOUS": Some patterns raise concerns but are not conclusive. There may be unusual bursts, some unexplained text, or moderate tab-away-then-type patterns.
- "LIKELY_AI_ASSISTED": Strong evidence of external text sources. Examples: very low correction rates, large amounts of unaccounted text, frequent tab-away-then-type patterns, or text appearing in complete blocks without corresponding keystrokes.

Each reason should be a specific, evidence-based observation referencing actual data from the file (e.g., "Only 12 backspace events out of 847 total keystrokes (1.4% correction rate)" or "3 tab-away events each followed by 200+ characters of error-free typing within 30 seconds").`;

// --- Main analysis function ---

export async function analyzeSFFile(sfFile: SFFile): Promise<AIAnalysisResult> {
  const connection = await getSnowflakeConnection();

  const sfFileJson = JSON.stringify(sfFile);

  // Snowflake Cortex AI_COMPLETE accepts a model name and a prompt.
  // We combine the system prompt and the .sf file into a single user message,
  // since the SQL function signature is: AI_COMPLETE(model, prompt)
  const fullPrompt = `${SYSTEM_PROMPT}\n\n## Student Writing Session (.sf file)\n\n${sfFileJson}`;
  const model = "mistral-large2";

  const rows = await new Promise<Record<string, string>[]>((resolve, reject) => {
    connection.execute({
      sqlText: `SELECT SNOWFLAKE.CORTEX.AI_COMPLETE(?, ?) AS analysis_result`,
      binds: [model, fullPrompt],
      complete: (err, _stmt, rows) => {
        if (err) {
          console.error("Snowflake Cortex AI query error:", err);
          reject(err);
        } else {
          resolve(rows as Record<string, string>[]);
        }
      },
    });
  });

  const rawResult =
    rows?.[0]?.ANALYSIS_RESULT ?? rows?.[0]?.analysis_result;

  if (!rawResult) {
    throw new Error("No result returned from Snowflake Cortex AI");
  }

  // Parse the model's JSON response
  // The model may wrap the JSON in markdown code fences, so strip those
  const cleaned = rawResult
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse AI response as JSON:", rawResult);
    // Return a fallback result rather than crashing the submission
    return {
      verdict: "SUSPICIOUS",
      confidence: 0,
      reasons: [`AI analysis returned unparseable response: ${rawResult.substring(0, 200)}`],
    };
  }

  // Validate the parsed response structure
  const result = parsed as Record<string, unknown>;

  const validVerdicts = ["LIKELY_HUMAN", "SUSPICIOUS", "LIKELY_AI_ASSISTED"];
  const verdict = validVerdicts.includes(result.verdict as string)
    ? (result.verdict as AIAnalysisResult["verdict"])
    : "SUSPICIOUS";

  const confidence =
    typeof result.confidence === "number" && result.confidence >= 0 && result.confidence <= 1
      ? result.confidence
      : 0.5;

  const reasons = Array.isArray(result.reasons)
    ? result.reasons.filter((r): r is string => typeof r === "string")
    : [];

  return { verdict, confidence, reasons };
}
