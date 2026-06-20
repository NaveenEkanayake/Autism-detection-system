import { useState, useEffect } from "react";
import { api } from "../lib/api";

export function usePatients() {
  const [patients, setPatients] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/patients")
      .then((data) => {
        setPatients(data);
        if (data.length > 0) setActivePatient(data[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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

  return { patients, setPatients, activePatient, setActivePatient, loading, getAgeMonths, getAgeLabel };
}
