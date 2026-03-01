export default function HowItWorks() {
  const steps = [
    {
      id: "01",
      role: "Student",
      title: "Write in SF Editor",
      description: "Students draft naturally while SF captures writing behavior in the background.",
      sideClass: "md:mr-24 reveal-side-left",
      markerClass: "bg-brand-red",
    },
    {
      id: "02",
      role: "Student",
      title: "Revise and Save",
      description: "Edits, pauses, and saved milestones are preserved so progress is clearly documented.",
      sideClass: "md:ml-24 reveal-side-right",
      markerClass: "bg-gray-900",
    },
    {
      id: "03",
      role: "System",
      title: "Generate the SF File",
      description: "At submission, SF packages the full writing history into a shareable evidence file.",
      sideClass: "md:mr-24 reveal-side-left",
      markerClass: "bg-gray-900",
    },
    {
      id: "04",
      role: "Teacher",
      title: "Review in the Viewer",
      description: "Teachers replay the timeline to assess growth, effort, and authenticity with context.",
      sideClass: "md:ml-24 reveal-side-right",
      markerClass: "bg-brand-red",
    }
  ];

  return (
    <section id="how-it-works" className="py-28 md:py-32 bg-white relative overflow-hidden reveal">
      <div className="max-w-[80rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-16 text-center reveal reveal-delay-100">
          <h2 className="section-title-display text-gray-900 mb-6">
            How SF Works
          </h2>
          <p className="section-copy-standard max-w-4xl mx-auto text-gray-500">
            A clear student-to-teacher workflow built for evidence-based writing assessment.
          </p>
        </div>

        <div className="mt-14 space-y-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`reveal ${step.sideClass} rounded-2xl border border-gray-200 bg-gray-50/80 p-6 md:p-10 shadow-sm`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-gray-700">
                  {step.role}
                </span>
                <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-white text-lg font-black ${step.markerClass}`}>
                  {step.id}
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-3">{step.title}</h3>
              <p className="section-copy-standard max-w-4xl">{step.description}</p>

              {index !== steps.length - 1 && (
                <div className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
