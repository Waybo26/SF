"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import ScaleGrid from "./ScaleGrid";

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Simple parallax effect for the title frame
    const handleMouseMove = (e: MouseEvent) => {
      if (!titleRef.current) return;
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;
      titleRef.current.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg)`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative pt-28 pb-24 lg:pt-40 lg:pb-32 overflow-hidden min-h-[85vh] flex flex-col justify-center">
      
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         {/* Mesh Gradient Base */}
         <div className="absolute inset-0 mesh-bg-hero opacity-80"></div>
         
         {/* Animated "Pulse" Circle - Subtle Red Glow */}
         <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-red/5 rounded-full blur-[120px] animate-pulse-slow"></div>
         
         {/* Scale Grid Background */}
         <ScaleGrid />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center max-w-5xl mx-auto mb-16 md:mb-24">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur border border-red-100 text-brand-red text-sm font-bold uppercase tracking-widest mb-10 animate-fade-in-up shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse shadow-glow"></span>
            Writing Process Evidence
          </div>
          
          {/* Hero Title Frame Container */}
          <div className="relative inline-block p-9 md:p-12 mb-10 group transition-transform duration-100 ease-out" ref={titleRef}>
              
              {/* Glass Background Panel with Tech Grid */}
              <div className="absolute inset-0 bg-white/60 backdrop-blur-md border border-white/80 shadow-2xl rounded-sm opacity-0 animate-fade-in-up delay-200 overflow-hidden z-1" style={{ animationFillMode: 'forwards' }}>
                  {/* Subtle Tech Grid Pattern */}
                  <div className="absolute inset-0 tech-grid opacity-30"></div>
                  {/* Diagonal Shine */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"></div>
              </div>
              
              {/* Animated Corner Frames - Enhanced */}
              <div className="absolute top-0 left-0 w-24 h-24 border-t-[6px] border-l-[6px] border-brand-red opacity-0 animate-fade-in-up delay-300 z-20" style={{ animationFillMode: 'forwards' }}></div>
              <div className="absolute top-2 left-2 w-4 h-4 bg-brand-red/20 z-20"></div>

              <div className="absolute top-0 right-0 w-24 h-24 border-t-[6px] border-r-[6px] border-brand-red opacity-0 animate-fade-in-up delay-300 z-20" style={{ animationFillMode: 'forwards' }}></div>
              <div className="absolute top-2 right-2 w-4 h-4 bg-brand-red/20 z-20"></div>

              <div className="absolute bottom-0 left-0 w-24 h-24 border-b-[6px] border-l-[6px] border-brand-red opacity-0 animate-fade-in-up delay-300 z-20" style={{ animationFillMode: 'forwards' }}></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 bg-brand-red/20 z-20"></div>

              <div className="absolute bottom-0 right-0 w-24 h-24 border-b-[6px] border-r-[6px] border-brand-red opacity-0 animate-fade-in-up delay-300 z-20" style={{ animationFillMode: 'forwards' }}></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 bg-brand-red/20 z-20"></div>

              <div className="absolute top-4 right-6 text-[10px] tracking-widest font-mono text-gray-500 flex items-center gap-2 z-20">
                <span>AI: 0% DETECTED</span>
                <span className="inline-block w-2 h-2 rounded-full bg-brand-red"></span>
              </div>

              <h1 className="relative z-10 text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 leading-[0.95] drop-shadow-sm mix-blend-multiply">
                <span className="block animate-fade-in-up delay-100">BRINGING BACK</span>
                <span className="block animate-fade-in-up delay-200">CRITICAL THINKING</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-red via-red-600 to-brand-red-light animate-fade-in-up delay-300 pb-2">
                  TO STUDENT THINKING
                </span>
              </h1>
          </div>
          
          <p className="mt-6 max-w-3xl mx-auto text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed font-medium tracking-tight animate-fade-in-up delay-300">
            SF helps educators evaluate writing with confidence by capturing how students draft, revise, and build ideas over time. In the Viewer, teachers can review the full timeline to assess growth, effort, and authenticity with context.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up delay-300 relative z-20">
            <Link 
              href="/editor" 
              className="px-8 py-4 rounded-none bg-brand-red text-white text-base font-bold hover:bg-brand-red-light transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[2px] hover:translate-y-[2px] border-2 border-brand-red uppercase tracking-wide"
            >
              Log in
            </Link>
            <Link 
              href="#how-it-works" 
              className="px-8 py-4 rounded-none bg-white text-gray-900 border-2 border-gray-200 text-base font-bold hover:bg-gray-50 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] hover:translate-x-[2px] hover:translate-y-[2px] uppercase tracking-wide"
            >
              How It Works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
