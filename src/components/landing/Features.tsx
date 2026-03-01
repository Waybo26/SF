export default function Features() {
  return (
    <section id="features" className="py-32 bg-brand-red relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white">
        
        <div className="space-y-8 reveal reveal-delay-100">
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] drop-shadow-md">
              THE NEW STANDARD FOR <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-white">ACADEMIC INTEGRITY.</span>
            </h2>
            
            <div className="w-24 h-1 bg-white/30 mx-auto rounded-full my-8"></div>
            
            <p className="text-2xl md:text-3xl font-medium text-red-50 max-w-4xl mx-auto leading-relaxed tracking-tight">
              Designed specifically for <span className="text-white font-bold border-b-2 border-white/40 pb-1">educators</span> to verify authenticity with confidence.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
                <div className="p-6 rounded-2xl bg-white/10 backdrop-blur border border-white/10 hover:bg-white/20 transition-all duration-300 group">
                    <div className="text-3xl font-bold mb-2 group-hover:scale-105 transition-transform">🛡️</div>
                    <h3 className="text-xl font-bold mb-2">Prevent AI Misuse</h3>
                    <p className="text-red-100 text-sm leading-relaxed">Stop guessing with detectors. See the actual writing process.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/10 backdrop-blur border border-white/10 hover:bg-white/20 transition-all duration-300 group">
                    <div className="text-3xl font-bold mb-2 group-hover:scale-105 transition-transform">✅</div>
                    <h3 className="text-xl font-bold mb-2">Reliable Verification</h3>
                    <p className="text-red-100 text-sm leading-relaxed">Proof of effort that holds up to scrutiny. 100% transparent.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/10 backdrop-blur border border-white/10 hover:bg-white/20 transition-all duration-300 group">
                    <div className="text-3xl font-bold mb-2 group-hover:scale-105 transition-transform">🔗</div>
                    <h3 className="text-xl font-bold mb-2">Seamless Integration</h3>
                    <p className="text-red-100 text-sm leading-relaxed">Works with your existing workflow. No complex setup required.</p>
                </div>
            </div>
        </div>

      </div>
      
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-white rounded-full blur-[150px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-red-dark rounded-full blur-[120px]"></div>
      </div>
    </section>
  );
}
