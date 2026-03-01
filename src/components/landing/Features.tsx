export default function Features() {
  return (
    <section id="features" className="py-0 relative overflow-hidden">
       {/* 1. "Anti-AI" High Impact Section (Red Gradient Background) */}
       <div className="py-32 bg-gradient-to-b from-white via-red-50 to-white relative reveal">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  
                  {/* Left: Punchy Text */}
                  <div className="space-y-8 reveal reveal-delay-100">
                      <h2 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[0.9]">
                          AI Detectors <span className="text-red-300 line-through decoration-brand-red decoration-4">Fail.</span><br/>
                          The Process <span className="text-brand-red">Doesn't.</span>
                      </h2>
                      <p className="text-2xl font-medium text-gray-600 max-w-lg leading-relaxed">
                          Stop playing the cat-and-mouse game. <br/>
                          <span className="text-brand-red font-bold">Shift the focus</span> from policing the final product to valuing the student's journey.
                      </p>
                  </div>

                  {/* Right: Abstract "Anti-AI" Graphic */}
                  <div className="relative h-[500px] w-full flex items-center justify-center perspective-[1000px] reveal reveal-delay-200">
                      {/* Floating Card: AI Probability */}
                      <div className="absolute top-10 right-10 w-72 h-40 bg-white rounded-xl shadow-xl border border-red-100 p-6 rotate-6 opacity-60 blur-[1px] transform transition-transform hover:rotate-0 hover:scale-105 hover:opacity-100 hover:blur-0 duration-500 z-0">
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Turnitin Report</div>
                          <div className="text-4xl font-black text-gray-300">
                             AI: <span className="text-red-200">??%</span>
                          </div>
                          <div className="mt-2 w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="w-1/2 h-full bg-red-100"></div>
                          </div>
                      </div>

                      {/* Floating Card: Process Verification (Main) */}
                      <div className="relative w-80 h-96 bg-brand-red rounded-2xl shadow-2xl shadow-brand-red/30 p-8 text-white -rotate-3 z-10 transform transition-transform hover:rotate-0 hover:scale-105 duration-500 flex flex-col justify-between overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                          
                          <div>
                              <div className="text-sm font-bold text-red-100 uppercase tracking-widest mb-1">SF Editor</div>
                              <div className="text-5xl font-black tracking-tight">Verified</div>
                              <div className="text-lg text-red-100 font-medium mt-1">Human Process</div>
                          </div>

                          <div className="space-y-4">
                              <div className="flex items-center gap-3 text-sm font-medium">
                                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">✓</div>
                                  <span>Organic Typing Flow</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm font-medium">
                                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">✓</div>
                                  <span>Draft Snapshots</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm font-medium">
                                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">✓</div>
                                  <span>Edit History</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
       </div>

       {/* 2. Detailed Features Grid (White Background) */}
       <div className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Card 1: Keystroke Logging */}
                <div className="group bg-gray-50/50 rounded-3xl p-10 hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 border border-transparent hover:border-gray-100 relative overflow-hidden reveal reveal-delay-100">
                    <div className="h-48 mb-8 bg-white rounded-2xl border border-gray-100 shadow-inner p-6 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                        <div className="font-mono text-xs text-gray-400 space-y-1">
                             <div className="flex gap-2"><span className="text-brand-red">LOG</span> <span>timestamp: 12401</span></div>
                             <div className="flex gap-2"><span className="text-brand-red">KEY</span> <span>input: "T"</span></div>
                             <div className="flex gap-2"><span className="text-brand-red">KEY</span> <span>input: "h"</span></div>
                             <div className="flex gap-2"><span className="text-blue-400">EVT</span> <span>paste: 0 chars</span></div>
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Granular Logging.</h3>
                    <p className="text-lg text-gray-500 leading-relaxed font-medium">
                        Every character, backspace, and pause is recorded. We capture the microscopic details of creation.
                    </p>
                </div>

                {/* Card 2: Draft Snapshots */}
                <div className="group bg-gray-50/50 rounded-3xl p-10 hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 border border-transparent hover:border-gray-100 relative overflow-hidden reveal reveal-delay-200">
                    <div className="h-48 mb-8 bg-white rounded-2xl border border-gray-100 shadow-inner flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                        <div className="w-24 h-32 bg-white border border-gray-200 shadow-lg rounded-lg rotate-6 absolute top-8 left-1/3"></div>
                        <div className="w-24 h-32 bg-red-50 border border-red-100 shadow-md rounded-lg -rotate-6 absolute top-8 left-1/3 transform -translate-x-4"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Evolution Snapshots.</h3>
                    <p className="text-lg text-gray-500 leading-relaxed font-medium">
                        Review the evolution of arguments and see how ideas matured over time.
                    </p>
                </div>

                {/* Card 3: Timeline Analysis */}
                <div className="group bg-gray-50/50 rounded-3xl p-10 hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 border border-transparent hover:border-gray-100 relative overflow-hidden reveal reveal-delay-300">
                    <div className="h-48 mb-8 bg-white rounded-2xl border border-gray-100 shadow-inner flex items-center justify-center px-8 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative">
                           <div className="absolute top-0 left-0 h-full w-2/3 bg-brand-red"></div>
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Visual Verification.</h3>
                    <p className="text-lg text-gray-500 leading-relaxed font-medium">
                        Identify irregular patterns like massive paste events or unnatural typing speeds instantly.
                    </p>
                </div>
            </div>
          </div>
       </div>
    </section>
  );
}
