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
    // Grid configuration
    const cols = 20;
    const rows = 12;
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
        delay: Math.random() * 5, // Random delay up to 5s
        duration: 3 + Math.random() * 4 // Random duration 3-7s
      };
    });

    setCells(newCells);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
      <div className="w-full h-full grid grid-cols-12 md:grid-cols-20 gap-1 opacity-60">
        {cells.map((cell) => (
          <div 
            key={cell.id}
            className={`
              w-full h-full rounded-sm transition-all duration-1000
              ${cell.type === "red" ? "animate-pulse-red" : ""}
              ${cell.type === "neutral" ? "animate-pulse-neutral" : ""}
            `}
            style={{
              animationDelay: `${cell.delay}s`,
              animationDuration: `${cell.duration}s`
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
