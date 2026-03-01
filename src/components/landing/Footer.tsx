"use client";

import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  const handleSeed = async () => {
    setSeedStatus("Seeding...");
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error("Failed to seed");
      setSeedStatus("Done!");
      setTimeout(() => setSeedStatus(null), 3000);
    } catch (err) {
      setSeedStatus("Error");
      setTimeout(() => setSeedStatus(null), 3000);
    }
  };

  return (
    <footer className="bg-white text-gray-600 py-16 border-t border-gray-100 relative overflow-hidden">
      {/* Footer Mesh Gradient */}
      <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-gray-50 to-transparent -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-1">
            <span className="text-xl font-bold text-brand-red tracking-tight">SF</span>
            <p className="mt-4 text-sm text-gray-500">
              Empowering academic integrity through transparent writing processes.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href="/editor" className="text-base hover:text-brand-red transition-colors">Student Editor</Link></li>
              <li><Link href="/teacher" className="text-base hover:text-brand-red transition-colors">Teacher Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><Link href="#how-it-works" className="text-base hover:text-brand-red transition-colors">How it Works</Link></li>
              <li><Link href="#features" className="text-base hover:text-brand-red transition-colors">Features</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Contact</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-base hover:text-brand-red transition-colors">Support</a></li>
              <li><a href="#" className="text-base hover:text-brand-red transition-colors">Contact Sales</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} SF Editor. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
             <button 
               onClick={handleSeed} 
               className="hover:text-brand-red transition-colors text-xs opacity-50 hover:opacity-100"
               title="Seed Database with Test Data"
             >
               {seedStatus || "Dev: Seed DB"}
             </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
