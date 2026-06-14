import { Brain, Heart, BarChart3, FileText, Check, AlertCircle } from "lucide-react";

export const SDQ_QUESTIONS = [
  {
    id: 1,
    category: "Emotional Symptoms",
    questions: [
      { id: "e1", text: "Often complains of headaches, stomach-aches or sickness", scale: 1 },
      { id: "e2", text: "Many worries, often seems worried", scale: 2 },
      { id: "e3", text: "Easily scared, gets frightened easily", scale: 3 },
      { id: "e4", text: "Often unhappy, downhearted or tearful", scale: 4 },
      { id: "e5", text: "Nervous or clingy in new situations, easily loses confidence", scale: 5 },
    ]
  },
  {
    id: 2,
    category: "Conduct Problems",
    questions: [
      { id: "c1", text: "Often has temper tantrums or hot temper", scale: 1 },
      { id: "c2", text: "Generally obedient, usually does what adults request", scale: 2 },
      { id: "c3", text: "Often fights with other children or bullies them", scale: 3 },
      { id: "c4", text: "Often lies or cheats", scale: 4 },
      { id: "c5", text: "Steals from home, school or elsewhere", scale: 5 },
    ]
  },
  {
    id: 3,
    category: "Hyperactivity/Inattention",
    questions: [
      { id: "h1", text: "Restless, overactive, cannot stay still for long", scale: 1 },
      { id: "h2", text: "Squirms or fidgets during lessons or mealtimes", scale: 2 },
      { id: "h3", text: "Easily distracted, concentration wanders", scale: 3 },
      { id: "h4", text: "Thinks things out before acting", scale: 4 },
      { id: "h5", text: "Sees tasks through to the end, good attention span", scale: 5 },
    ]
  },
  {
    id: 4,
    category: "Peer Relationship Problems",
    questions: [
      { id: "p1", text: "Rather solitary, tends to play alone", scale: 1 },
      { id: "p2", text: "Has at least one good friend", scale: 2 },
      { id: "p3", text: "Generally liked by other children", scale: 3 },
      { id: "p4", text: "Picked on or bullied by other children", scale: 4 },
      { id: "p5", text: "Gets on better with adults than with other children", scale: 5 },
    ]
  },
  {
    id: 5,
    category: "Prosocial Behaviour",
    questions: [
      { id: "pr1", text: "Considerate of other people's feelings", scale: 1 },
      { id: "pr2", text: "Shares readily with other children", scale: 2 },
      { id: "pr3", text: "Helpful if someone is hurt, upset or feeling ill", scale: 3 },
      { id: "pr4", text: "Kind to younger children", scale: 4 },
      { id: "pr5", text: "Often volunteers to help others", scale: 5 },
    ]
  },
];

export const HEALTH_TRACKER_ITEMS = [
  {
    id: "milestones",
    icon: Check,
    title: "CDC Milestone Checker",
    description: "Track developmental milestones by age",
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "growth",
    icon: BarChart3,
    title: "Growth Charts",
    description: "Monitor height, weight & head circumference",
    color: "from-purple-500 to-pink-500"
  },
  {
    id: "sleep",
    icon: Heart,
    title: "Sleep Logs",
    description: "Track sleep patterns and duration",
    color: "from-indigo-500 to-blue-500"
  },
];

export const AI_MODELS = [
  {
    id: "vision",
    name: "Vision Model",
    accuracy: 94.8,
    description: "Facial expression & eye-gaze detection",
    metrics: ["Gaze Direction", "Facial Expression", "Head Positioning"]
  },
  {
    id: "behavioral",
    name: "Behavioral Model",
    accuracy: 91.2,
    description: "Movement patterns & behavioral analysis",
    metrics: ["Movement Analysis", "Attention Patterns", "Social Engagement"]
  },
  {
    id: "audio",
    name: "Audio Model",
    accuracy: 88.5,
    description: "Speech patterns & vocalization analysis",
    metrics: ["Speech Patterns", "Prosody Analysis", "Vocalization"]
  },
];

export const SEVERITY_LEVELS = [
  { level: "No Risk", score: 0, color: "bg-green-500", description: "Low probability of ASD" },
  { level: "Low Risk", score: 1, color: "bg-yellow-500", description: "Some indicators present" },
  { level: "Medium Risk", score: 2, color: "bg-orange-500", description: "Moderate indicators" },
  { level: "High Risk", score: 3, color: "bg-red-500", description: "Strong ASD indicators" },
];