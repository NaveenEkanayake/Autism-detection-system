import { useState } from "react";

const DEMO_PATIENT = {
  id: "demo-patient-1",
  name: "Alex",
  sex: "male",
  dob: "2021-06-15",
};

export function usePatients() {
  const [activePatient, setActivePatient] = useState(DEMO_PATIENT);
  const [patients, setPatients] = useState([DEMO_PATIENT]);

  const getAgeMonths = (dob) => {
    const birth = new Date(dob);
    const now = new Date();
    return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  };

  const getAgeLabel = (dob) => {
    const months = getAgeMonths(dob);
    if (months < 24) return `${months} months`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? "s" : ""}`;
  };

  return { activePatient, setActivePatient, patients, setPatients, getAgeMonths, getAgeLabel };
}
