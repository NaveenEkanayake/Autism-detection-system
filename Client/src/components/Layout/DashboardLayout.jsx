import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import { usePatients } from "../../hooks/usePatients";
import AddChildForm from "../forms/AddChildForm";
import { showToast } from "../ui/toast";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const { activePatient } = usePatients();

  // Background reminder notification scanner daemon
  useEffect(() => {
    if (!activePatient?.id) return;

    const checkReminders = () => {
      try {
        const events = JSON.parse(localStorage.getItem(`events_${activePatient.id}`) || "[]");
        const notifiedList = JSON.parse(localStorage.getItem(`notified_events_${activePatient.id}`) || "[]");
        const now = Date.now();
        let updatedNotified = [...notifiedList];
        let hasNewNotification = false;

        events.forEach((ev) => {
          if (notifiedList.includes(ev.id)) return;

          const eventTime = new Date(`${ev.startDate}T${ev.startTime}`).getTime();
          const diffMinutes = (eventTime - now) / (1000 * 60);

          const reminderThreshold = ev.reminderMinutes || 15;
          if (diffMinutes >= -5 && diffMinutes <= reminderThreshold) {
            hasNewNotification = true;
            updatedNotified.push(ev.id);

            // Browser system notification
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`AuraTrack Reminder: ${ev.title}`, {
                body: `${ev.category.toUpperCase()} is scheduled at ${ev.startTime}.${ev.location ? ` Location: ${ev.location}` : ""}`,
              });
            }

            // In-app visual alert toast
            showToast({
              title: `Reminder: ${ev.title}`,
              description: `${ev.category.toUpperCase()} starts soon at ${ev.startTime}!`,
              type: "warning",
            });
          }
        });

        if (hasNewNotification) {
          localStorage.setItem(`notified_events_${activePatient.id}`, JSON.stringify(updatedNotified));
        }
      } catch (err) {
        console.error("Reminder check failed:", err);
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 15000);
    return () => clearInterval(interval);
  }, [activePatient?.id]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isMobile, sidebarOpen]);

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)", color: "var(--text-primary)" }}>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main
        className="transition-all duration-300 ease-in-out"
        style={{ marginLeft: !isMobile && sidebarOpen ? "280px" : "0px" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative">
          <button
            onClick={() => setSidebarOpen((p) => !p)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-md border"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--card-border)",
            }}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div>
          <Outlet />
        </div>
      </main>
      <ChildModal />
    </div>
  );
}

function ChildModal() {
  const { addChildOpen, setAddChildOpen, editingChild, setEditingChild, addChild, updateChild } = usePatients();

  const handleClose = () => {
    setAddChildOpen(false);
    setEditingChild(null);
  };

  const handleAddOrEdit = async (formData) => {
    if (editingChild) {
      await updateChild(editingChild.id, formData);
    } else {
      await addChild(formData);
    }
    handleClose();
  };

  return (
    <AnimatePresence>
      {addChildOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden"
              style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--card-border)" }}>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    {editingChild ? "Edit Child Profile" : "Add a Child"}
                  </h3>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {editingChild ? "Update details for child profile" : "Enter details to track development"}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                >
                  <X className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                </button>
              </div>
              <div className="p-6">
                <AddChildForm 
                  onAdd={handleAddOrEdit} 
                  onCancel={handleClose} 
                  initialData={editingChild ? { name: editingChild.name, dob: editingChild.dob, sex: editingChild.sex } : null}
                  key={editingChild ? `edit-${editingChild.id}` : "add-new"}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
