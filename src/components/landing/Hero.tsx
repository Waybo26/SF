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
    <section className="relative pt-32 pb-32 lg:pt-48 lg:pb-40 overflow-hidden min-h-[90vh] flex flex-col justify-center">
      
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         {/* Mesh Gradient Base */}
         <div className="absolute inset-0 mesh-bg-hero opacity-80"></div>
         
         {/* Animated "Pulse" Circle - Subtle Red Glow */}
         <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-red/5 rounded-full blur-[120px] animate-pulse-slow"></div>
         
         {/* Scale Grid Background */}
         <ScaleGrid />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="text-center max-w-6xl mx-auto mb-20 md:mb-32">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur border border-red-100 text-brand-red text-sm font-bold uppercase tracking-widest mb-12 animate-fade-in-up shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-red animate-pulse shadow-glow"></span>
            Process-Based Assessment
          </div>
          
          {/* Hero Title Frame Container */}
          <div className="relative inline-block p-12 md:p-16 mb-12 group transition-transform duration-100 ease-out" ref={titleRef}>
              
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

              <h1 className="relative z-10 text-6xl md:text-9xl font-black tracking-tighter text-gray-900 leading-[0.9] drop-shadow-sm mix-blend-multiply">
                <span className="block animate-fade-in-up delay-100">THE PLATFORM</span>
                <span className="block animate-fade-in-up delay-200">THAT PROVES</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-red via-red-600 to-brand-red-light animate-fade-in-up delay-300 pb-2">
                  THE PROCESS.
                </span>
              </h1>
          </div>
          
          <p className="mt-8 max-w-3xl mx-auto text-2xl md:text-3xl text-gray-600 mb-12 leading-relaxed font-medium tracking-tight animate-fade-in-up delay-300">
            Go beyond the final draft. Reveal the <span className="text-brand-red font-bold underline decoration-red-200 decoration-4 underline-offset-4">authentic journey</span> of student writing.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fade-in-up delay-300 relative z-20">
            <Link 
              href="/editor" 
              className="px-10 py-5 rounded-none bg-brand-red text-white text-lg font-bold hover:bg-brand-red-light transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[2px] hover:translate-y-[2px] border-2 border-brand-red uppercase tracking-wide"
            >
              Start Writing
            </Link>
            <Link 
              href="#how-it-works" 
              className="px-10 py-5 rounded-none bg-white text-gray-900 border-2 border-gray-200 text-lg font-bold hover:bg-gray-50 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] hover:translate-x-[2px] hover:translate-y-[2px] uppercase tracking-wide"
            >
              How It Works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
