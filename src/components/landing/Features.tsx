export default function Features() {
  return (
    <section id="features" className="py-24 md:py-28 bg-brand-red relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center text-white">
        
        <div className="space-y-7 reveal reveal-delay-100">
            <h2 className="section-title-display text-white drop-shadow-md">
              WHAT SF DELIVERS
            </h2>
            
            <div className="w-24 h-1 bg-white/30 mx-auto rounded-full my-8"></div>
            
            <p className="text-lg md:text-xl font-medium text-red-50 max-w-4xl mx-auto leading-relaxed">
              One clear workflow that gives teachers evidence they can trust.
            </p>

            <div className="mt-10 max-w-5xl mx-auto rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-6 md:p-10 text-left">
                <p className="text-base md:text-lg text-red-50 leading-relaxed">
                  <span className="font-bold text-white">Capture:</span> Students write, revise, and save naturally while SF preserves the full writing history.
                </p>
                <div className="h-px my-5 bg-white/20"></div>
                <p className="text-base md:text-lg text-red-50 leading-relaxed">
                  <span className="font-bold text-white">Review:</span> Teachers open the Viewer and inspect an interactive timeline of how the final draft was built.
                </p>
                <div className="h-px my-5 bg-white/20"></div>
                <p className="text-base md:text-lg text-red-50 leading-relaxed">
                  <span className="font-bold text-white">Decide:</span> Assessment becomes more fair and informed because decisions are based on process evidence, not guesswork.
                </p>
                <div className="h-px my-5 bg-white/20"></div>
                <p className="text-sm md:text-base text-red-100 leading-relaxed">
                  SF helps schools protect academic integrity while keeping feedback focused on growth and learning.
                </p>
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
