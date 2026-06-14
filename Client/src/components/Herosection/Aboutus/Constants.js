import { Baby, HeartHandshake, Activity } from "lucide-react";

export const ABOUT_SLIDES = [
  {
    id: "early-detection",
    label: "Early Detection",
    icon: Baby,
    tag: "01",
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
    smallImage: "https://images.unsplash.com/photo-1503454537688-e6694d30b04b?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
    title: "Catching Signs Before Age 5",
    description: "Aura Track is purpose-built for the critical 3–5 year developmental window.",
    features: [
      "Developmental milestone tracking from age 2-5",
      "Real-time behavioral pattern analysis",
      "Early warning indicators before formal diagnosis",
      "Evidence-based screening protocols"
    ]
  },
  {
    id: "parent-engagement",
    label: "Parent-Led Insights",
    icon: HeartHandshake,
    tag: "02",
    image: "https://images.unsplash.com/photo-1491013516836-7db643ee125a?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
    smallImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
    title: "Empowering Families at Home",
    description: "Parents and caregivers are the first to notice behavioral patterns.",
    features: [
      "Digital SDQ questionnaires with guided prompts",
      "Real-time feedback on responses",
      "Secure HIPAA-compliant data storage",
      "Family-friendly progress tracking"
    ]
  },
  {
    id: "clinical-portal",
    label: "Clinical Dashboard",
    icon: Activity,
    tag: "03",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3",
    smallImage: "https://images.unsplash.com/photo-1460925895917-adf4e565db18?q=80&w=400&auto=format&fit=crop&ixlib=rb-4.0.3",
    title: "Bridging Parents & Clinicians",
    description: "Pediatric nurses and specialists access a unified dashboard.",
    features: [
      "Integrated data visualization dashboard",
      "Risk stratification algorithms",
      "One-click clinical referral system",
      "Secure provider-parent messaging"
    ]
  },
];

export const LAYER_VECTORS = {
  bgLayer: {
    enter: { scale: 1.12, y: 25, opacity: 0, rotate: 1 },
    active: { scale: 1.0, y: 0, opacity: 1, rotate: 0 },
    exit: { scale: 0.95, y: -20, opacity: 0, rotate: -0.5 },
  },
  midLayer: {
    enter: { opacity: 0, scale: 0.98 },
    active: { opacity: 0.6, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
  },
  fgLayer: {
    enter: { y: 60, opacity: 0, scale: 0.97 },
    active: { y: 0, opacity: 1, scale: 1 },
    exit: { y: -40, opacity: 0, scale: 0.97 },
  },
};

export const SCRUB_SMOOTHING = 1.2;