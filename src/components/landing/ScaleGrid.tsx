"use client";

import { useEffect, useState } from "react";

interface Cell {
  id: number;
  type: "red" | "neutral" | "empty";
  delay: number;
  duration: number;
}

export default function ScaleGrid() {
  const [cells, setCells] = useState<Cell[]>([]);

  useEffect(() => {
    // Reduced grid: 12 cols x 8 rows = 96 cells (down from 240)
    const cols = 12;
    const rows = 8;
    const totalCells = cols * rows;
    
    const newCells: Cell[] = Array.from({ length: totalCells }).map((_, i) => {
      const rand = Math.random();
      let type: "red" | "neutral" | "empty" = "empty";
      
      // 15% chance for red, 30% chance for neutral, rest empty
      if (rand > 0.85) type = "red";
      else if (rand > 0.55) type = "neutral";
      
      return {
        id: i,
        type,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
      };
    });

    setCells(newCells);
  }, []);

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none"
      style={{ contain: "layout style paint" }}
    >
      <div className="w-full h-full grid grid-cols-8 md:grid-cols-12 gap-1 opacity-60">
        {cells.map((cell) => (
          <div 
            key={cell.id}
            className={`
              w-full h-full rounded-sm
              ${cell.type === "red" ? "bg-brand-red/25 animate-pulse-red" : ""}
              ${cell.type === "neutral" ? "bg-black/6 animate-pulse-neutral" : ""}
            `}
            style={{
              animationDelay: `${cell.delay}s`,
              animationDuration: `${cell.duration}s`,
              willChange: cell.type !== "empty" ? "opacity" : "auto",
            }}
          ></div>
        ))}
      </div>
      
      {/* Gradient overlay to fade out edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/80"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/40"></div>
    </div>
  );
}
