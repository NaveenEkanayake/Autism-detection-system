import { Upload, BrainCircuit, CheckCircle } from "lucide-react";

const STEPS = [
  { id: 1, name: "Upload", icon: Upload },
  { id: 2, name: "Processing", icon: BrainCircuit },
  { id: 3, name: "Analysis", icon: CheckCircle },
];

export default function Stepper({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-8 sm:gap-16 w-full max-w-2xl mx-auto mb-12">
      {STEPS.map((step) => (
        <div key={step.id} className="flex flex-col items-center gap-2 relative">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              currentStep >= step.id
                ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30"
                : "border-gray-300/50 text-gray-400"
            }`}
          >
            <step.icon className="w-6 h-6" />
          </div>
          <span
            className={`text-xs font-medium ${
              currentStep >= step.id ? "text-blue-400" : "text-gray-400"
            }`}
          >
            {step.name}
          </span>
        </div>
      ))}
    </div>
  );
}
