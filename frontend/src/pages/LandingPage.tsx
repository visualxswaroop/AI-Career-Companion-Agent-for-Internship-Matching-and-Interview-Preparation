import HeroSection from '../sections/HeroSection'
import HowItWorksSection from '../sections/HowItWorksSection'
import VoiceResumeSection from '../sections/VoiceResumeSection'
import ResumeAnalysisSection from '../sections/ResumeAnalysisSection'
import InternshipSection from '../sections/InternshipSection'
import CoverLetterSection from '../sections/CoverLetterSection'
import HumanCenteredSection from '../sections/HumanCenteredSection'
import FinalCTASection from '../sections/FinalCTASection'
import FooterSection from '../sections/FooterSection'

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <HowItWorksSection />
      <VoiceResumeSection />
      <ResumeAnalysisSection />
      <InternshipSection />
      <CoverLetterSection />
      <HumanCenteredSection />
      <FinalCTASection />
      <FooterSection />
    </main>
  )
}
