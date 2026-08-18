import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";
import { showToast } from "../components/ui/toast";

const PatientsContext = createContext();

export function PatientsProvider({ children }) {
  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem("patients");
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.filter((p) => p.name?.toLowerCase().trim() !== "sumane");
  });
  const [activePatient, setActivePatient] = useState(() => {
    const saved = localStorage.getItem("activePatient");
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed?.name?.toLowerCase().trim() === "sumane" ? null : parsed;
  });
  const [loading, setLoading] = useState(true);
  const [addChildOpen, setAddChildOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("patients", JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem("activePatient", JSON.stringify(activePatient));
  }, [activePatient]);

  const refreshPatients = useCallback(async () => {
    try {
      const data = await api("/patients");
      const filtered = (data || []).filter(
        (p) => p.name?.toLowerCase().trim() !== "sumane"
      );
      setPatients(filtered);
      if (filtered.length === 0) {
        setActivePatient(null);
      } else if (!activePatient || !filtered.some((p) => p.id === activePatient.id)) {
        setActivePatient(filtered[0]);
      }
      return filtered;
    } catch (err) {
      console.error("Failed to fetch patients:", err);
      if (err.message.includes("Authentication") || err.message.includes("401") || !localStorage.getItem("token")) {
        setPatients([]);
        setActivePatient(null);
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [activePatient]);

  useEffect(() => {
    refreshPatients();
  }, []);

  const addChild = async (childData) => {
    try {
      const newPatient = await api("/patients", {
        method: "POST",
        body: JSON.stringify(childData),
      });
      setPatients((prev) => [...prev, newPatient]);
      setActivePatient(newPatient);
      setAddChildOpen(false);
      showToast({
        title: "Child Added!",
        description: `${newPatient.name}'s profile has been created.`,
        type: "success",
      });
      return newPatient;
    } catch (err) {
      showToast({
        title: "Failed to Add Child",
        description: err.message,
        type: "error",
      });
      throw err;
    }
  };

  const deleteChild = async (id) => {
    try {
      await api(`/patients/${id}`, { method: "DELETE" });
      setPatients((prev) => prev.filter((p) => p.id !== id));
      if (activePatient?.id === id) {
        setActivePatient(null);
      }
      showToast({
        title: "Child Removed",
        description: "The child profile has been deleted.",
        type: "success",
      });
    } catch (err) {
      if (err.message.includes("not found") || err.message.includes("404")) {
        setPatients((prev) => prev.filter((p) => p.id !== id));
        if (activePatient?.id === id) {
          setActivePatient(null);
        }
        showToast({
          title: "Child Removed",
          description: "Stale child profile cleared from local state.",
          type: "success",
        });
        return;
      }
      showToast({
        title: "Failed to Remove Child",
        description: err.message,
        type: "error",
      });
      throw err;
    }
  };

  const switchPatient = (patient) => {
    setActivePatient(patient);
    localStorage.setItem("activePatient", JSON.stringify(patient));
  };

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
    <PatientsContext.Provider value={{ patients, setPatients, activePatient, setActivePatient, loading, getAgeMonths, getAgeLabel, refreshPatients, addChild, deleteChild, switchPatient, addChildOpen, setAddChildOpen }}>
      {children}
    </PatientsContext.Provider>
  );
}

export function usePatients() {
  return useContext(PatientsContext);
}
