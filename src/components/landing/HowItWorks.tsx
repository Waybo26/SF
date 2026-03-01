export default function HowItWorks() {
  const steps = [
    {
      id: "01",
      title: "Write",
      description: "Students write in the secure editor. Every keystroke is logged.",
      color: "bg-brand-red"
    },
    {
      id: "02",
      title: "Snapshot",
      description: "Drafts are saved at key milestones to show progress.",
      color: "bg-gray-800"
    },
    {
      id: "03",
      title: "Submit",
      description: "The .sf file is generated, containing the full history.",
      color: "bg-gray-800"
    },
    {
      id: "04",
      title: "Review",
      description: "Teachers play back the writing process like a video.",
      color: "bg-brand-red"
    }
  ];

  return (
    <section id="how-it-works" className="py-32 bg-white relative overflow-hidden reveal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-20 text-center reveal reveal-delay-100">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-6">
            The Timeline of Truth
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            A seamless workflow that integrates directly into your existing curriculum.
          </p>
        </div>

        <div className="relative mt-24">
          {/* Connecting Line (Horizontal) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-gray-100 -z-10 rounded-full"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {steps.map((step, index) => (
              <div key={step.id} className={`relative group text-center md:text-left reveal reveal-delay-${(index + 2) * 100}`}>
                {/* Step Marker */}
                <div className={`mx-auto md:mx-0 w-24 h-24 rounded-2xl ${step.color} text-white flex items-center justify-center text-3xl font-bold shadow-xl shadow-${step.color}/20 mb-8 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden ring-4 ring-white`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    {step.id}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed text-base">{step.description}</p>
                
                {/* Mobile Connector */}
                {index !== steps.length - 1 && (
                    <div className="md:hidden w-1 h-16 bg-gray-100 mx-auto my-8"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
