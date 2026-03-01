import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Footer from "@/components/landing/Footer";
import ScrollObserver from "@/components/landing/ScrollObserver";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <ScrollObserver />
      <Hero />
      <Features />
      <HowItWorks />
      <Footer />
    </main>
  );
}
