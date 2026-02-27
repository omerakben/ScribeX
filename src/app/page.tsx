import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { SpeedComparison } from "@/components/landing/speed-comparison";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeaturesGrid />
        <SpeedComparison />
        <HowItWorks />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
