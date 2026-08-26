import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { showToast } from "../components/ui/toast";
import { api } from "../lib/api";
import { useAuth } from "./useAuth";

const PatientsContext = createContext();

export function PatientsProvider({ children }) {
  const { user } = useAuth();
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
  const [editingChild, setEditingChild] = useState(null);

  useEffect(() => {
    localStorage.setItem("patients", JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem("activePatient", JSON.stringify(activePatient));
  }, [activePatient]);

  const refreshPatients = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setPatients([]);
      setActivePatient(null);
      setLoading(false);
      return [];
    }
    setLoading(true);
    try {
      const data = await api("/patients");
      setPatients(data);
      if (data.length > 0) {
        const savedActive = localStorage.getItem("activePatient");
        const parsedActive = savedActive ? JSON.parse(savedActive) : null;
        const exists = data.some((p) => p.id === parsedActive?.id);
        if (!parsedActive || !exists) {
          setActivePatient(data[0]);
        } else {
          const current = data.find((p) => p.id === parsedActive.id);
          setActivePatient(current);
        }
      } else {
        setActivePatient(null);
      }
      return data;
    } catch (err) {
      console.error("Failed to fetch patients:", err);
      setPatients([]);
      setActivePatient(null);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPatients();
  }, [refreshPatients, user]);

  const addChild = async (childData) => {
    try {
      const data = await api("/patients", {
        method: "POST",
        body: JSON.stringify(childData),
      });
      setPatients((prev) => [...prev, data]);
      setActivePatient(data);
      setAddChildOpen(false);
      showToast({
        title: "Child Added!",
        description: `${data.name}'s profile has been created.`,
        type: "success",
      });
      return data;
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
      await api(`/patients/${id}`, {
        method: "DELETE",
      });
      
      // Delete associated local child data
      localStorage.removeItem(`sdq_${id}`);
      localStorage.removeItem(`milestones_${id}`);
      localStorage.removeItem(`growth_${id}`);
      localStorage.removeItem(`sleep_${id}`);
      localStorage.removeItem(`documents_${id}`);
      localStorage.removeItem(`vision_${id}`);

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
      showToast({
        title: "Failed to Remove Child",
        description: err.message,
        type: "error",
      });
      throw err;
    }
  };

  const updateChild = async (id, childData) => {
    try {
      const data = await api(`/patients/${id}`, {
        method: "PATCH",
        body: JSON.stringify(childData),
      });
      setPatients((prev) => prev.map((p) => p.id === id ? data : p));
      if (activePatient?.id === id) {
        setActivePatient(data);
      }
      showToast({
        title: "Profile Updated",
        description: `${data.name}'s profile has been updated.`,
        type: "success",
      });
      return data;
    } catch (err) {
      showToast({
        title: "Failed to Update Profile",
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
    <PatientsContext.Provider value={{ patients, setPatients, activePatient, setActivePatient, loading, getAgeMonths, getAgeLabel, refreshPatients, addChild, updateChild, deleteChild, switchPatient, addChildOpen, setAddChildOpen, editingChild, setEditingChild }}>
      {children}
    </PatientsContext.Provider>
  );
}

export function usePatients() {
  return useContext(PatientsContext);
}
