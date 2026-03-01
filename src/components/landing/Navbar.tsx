"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full glass-panel z-50 border-b border-white/20 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="font-bold text-2xl text-brand-red tracking-tight">
              SF
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#features" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
              How it Works
            </Link>
            <div className="flex items-center space-x-4 ml-4">
              <Link 
                href="/editor" 
                className="text-gray-900 hover:text-brand-red font-medium text-sm transition-colors"
              >
                Student Editor
              </Link>
              <Link 
                href="/teacher" 
                className="bg-gray-900 text-white hover:bg-brand-red px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                Teacher Viewer
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white shadow-lg border-b border-gray-100 animate-in slide-in-from-top-2">
          <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col">
            <Link 
              href="/#features" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link 
              href="/#how-it-works" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              How it Works
            </Link>
            <div className="border-t border-gray-100 my-2 pt-2 space-y-2">
                <Link 
                  href="/editor" 
                  className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  Student Editor
                </Link>
                <Link 
                  href="/teacher" 
                  className="block w-full text-center px-4 py-2 border border-transparent rounded-md text-base font-medium text-white bg-brand-red hover:bg-red-800 shadow-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Teacher Viewer
                </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
