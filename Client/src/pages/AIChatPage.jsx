import PageWrapper from "../components/Layout/PageWrapper";
import { VercelV0Chat } from "../components/ui/V0AIChat";
import Stepper from "../components/ui/Stepper";

export default function AIChatPage() {
  return (
    <PageWrapper title="AI Assistant">
      <Stepper currentStep={3} />
      <VercelV0Chat />
    </PageWrapper>
  );
}
