import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

const PatientsContext = createContext();

export function PatientsProvider({ children }) {
  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem("patients");
    return saved ? JSON.parse(saved) : [];
  });
  const [activePatient, setActivePatient] = useState(() => {
    const saved = localStorage.getItem("activePatient");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem("patients", JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem("activePatient", JSON.stringify(activePatient));
  }, [activePatient]);

  useEffect(() => {
    if (patients.length === 0) {
      api("/patients")
        .then((data) => {
          setPatients(data);
          if (data.length > 0 && !activePatient) setActivePatient(data[0]);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const getAgeMonths = (dob) => {
    const birth = new Date(dob);
    const now = new Date();
    return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  };

  const getAgeLabel = (dob) => {
    if (!dob) return "";
    const months = getAgeMonths(dob);
    if (months < 24) return `${months} months`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? "s" : ""}`;
  };

  return (
    <PatientsContext.Provider value={{ patients, setPatients, activePatient, setActivePatient, loading, getAgeMonths, getAgeLabel }}>
      {children}
    </PatientsContext.Provider>
  );
}

export function usePatients() {
  return useContext(PatientsContext);
}
