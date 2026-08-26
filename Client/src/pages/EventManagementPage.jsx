import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Plus, Edit2, Trash2, Bell, Mail } from "lucide-react";
import { usePatients } from "../hooks/usePatients";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "../components/ui/toast";
import { api } from "../lib/api";

const CATEGORIES = [
  { id: "appointments", label: "Appointments", color: "#3b93f5", bg: "rgba(59, 147, 245, 0.15)" },
  { id: "events", label: "Events", color: "#14b8a6", bg: "rgba(20, 184, 166, 0.15)" },
  { id: "clinical events", label: "Clinical Events", color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)" },
  { id: "vaccine dates", label: "Vaccine Dates", color: "#f5b041", bg: "rgba(245, 176, 65, 0.15)" },
  { id: "medicine course reminders", label: "Medicine Course Reminders", color: "#ec4899", bg: "rgba(236, 72, 153, 0.15)" },
  { id: "others", label: "Others", color: "#64748b", bg: "rgba(100, 116, 139, 0.15)" },
];



export default function EventManagementPage() {
  const navigate = useNavigate();
  const { activePatient } = usePatients();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  // Delete confirmation modal (replaces window.confirm)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetTitle, setDeleteTargetTitle] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "appointments",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    description: "",
  });

  const containerRef = useRef(null);

  // Load events from backend (Firestore) with localStorage fallback
  useEffect(() => {
    if (!activePatient?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const loadEvents = async () => {
      try {
        const backendEvents = await api("/events");
        if (Array.isArray(backendEvents)) {
          const sorted = backendEvents.sort((a, b) => {
            const dtA = new Date(`${a.startDate}T${a.startTime || "00:00"}`);
            const dtB = new Date(`${b.startDate}T${b.startTime || "00:00"}`);
            return dtA - dtB;
          });
          setEvents(sorted);
          localStorage.setItem(`events_${activePatient.id}`, JSON.stringify(sorted));
        } else {
          throw new Error("Invalid response");
        }
      } catch (err) {
        console.warn("Backend events fetch failed, using localStorage:", err.message);
        try {
          const data = JSON.parse(localStorage.getItem(`events_${activePatient.id}`) || "[]");
          const sorted = data.sort((a, b) => {
            const dtA = new Date(`${a.startDate}T${a.startTime || "00:00"}`);
            const dtB = new Date(`${b.startDate}T${b.startTime || "00:00"}`);
            return dtA - dtB;
          });
          setEvents(sorted);
        } catch (localErr) {
          setEvents([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [activePatient?.id]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".event-header", { opacity: 0, y: 20, duration: 0.5, ease: "power3.out" });
      gsap.from(".event-content", { opacity: 0, y: 30, duration: 0.5, ease: "power2.out", delay: 0.2 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!activePatient?.id) return;
    if (!form.title.trim()) {
      showToast({ title: "Validation Error", description: "Event title is required.", type: "error" });
      return;
    }
    if (!form.startDate || !form.startTime) {
      showToast({ title: "Validation Error", description: "Start date and time are required.", type: "error" });
      return;
    }

    try {
      const eventData = {
        title: form.title.trim(),
        category: form.category,
        startDate: form.startDate,
        startTime: form.startTime,
        endDate: form.endDate || form.startDate,
        endTime: form.endTime || form.startTime,
        location: form.location.trim(),
        description: form.description.trim(),
        reminder_minutes: 0,
      };

      let savedEvent;
      if (editingEventId) {
        savedEvent = await api(`/events/${editingEventId}`, {
          method: "PATCH",
          body: JSON.stringify(eventData),
        });
        showToast({ title: "Event Updated", description: `"${eventData.title}" has been saved. Email reminder scheduled.`, type: "success" });
      } else {
        savedEvent = await api("/events", {
          method: "POST",
          body: JSON.stringify(eventData),
        });
        showToast({ title: "Event Logged", description: `"${eventData.title}" has been scheduled. Email notification sent.`, type: "success" });
      }

      // Refresh events list from backend
      try {
        const refreshed = await api("/events");
        if (Array.isArray(refreshed)) {
          const sorted = refreshed.sort((a, b) => {
            const dtA = new Date(`${a.startDate}T${a.startTime || "00:00"}`);
            const dtB = new Date(`${b.startDate}T${b.startTime || "00:00"}`);
            return dtA - dtB;
          });
          setEvents(sorted);
          localStorage.setItem(`events_${activePatient.id}`, JSON.stringify(sorted));
        }
      } catch (refreshErr) {
        // Fallback: add/update locally
        if (editingEventId) {
          setEvents(prev => prev.map(ev => ev.id === editingEventId ? savedEvent : ev));
        } else {
          setEvents(prev => [...prev, savedEvent].sort((a, b) => {
            const dtA = new Date(`${a.startDate}T${a.startTime}`);
            const dtB = new Date(`${b.startDate}T${b.startTime}`);
            return dtA - dtB;
          }));
        }
      }

      setForm({
        title: "",
        category: "appointments",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        location: "",
        description: "",
      });
      setShowEventForm(false);
      setEditingEventId(null);
    } catch (err) {
      console.error(err);
      showToast({ title: "Error Saving Event", description: err.message, type: "error" });
    }
  };

  const handleEditClick = (ev) => {
    setEditingEventId(ev.id);
    setForm({
      title: ev.title,
      category: ev.category,
      startDate: ev.startDate,
      startTime: ev.startTime,
      endDate: ev.endDate,
      endTime: ev.endTime,
      location: ev.location || "",
      description: ev.description || "",

    });
    setShowEventForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete confirmation using inline modal (no window.confirm)
  const triggerDeleteEvent = (eventId, eventTitle) => {
    setDeleteTargetId(eventId);
    setDeleteTargetTitle(eventTitle);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteEvent = async () => {
    const id = deleteTargetId;
    setDeleteModalOpen(false);
    setDeleteTargetId(null);
    setDeleteTargetTitle("");

    try {
      await api(`/events/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Backend delete failed, updating locally:", err.message);
    }

    setEvents(prev => prev.filter(ev => ev.id !== id));
    if (activePatient?.id) {
      const remaining = events.filter(ev => ev.id !== id);
      localStorage.setItem(`events_${activePatient.id}`, JSON.stringify(remaining));
    }
    showToast({ title: "Event Deleted", type: "success" });
  };

  const filteredEvents = filterCategory === "all"
    ? events
    : events.filter(e => e.category === filterCategory);

  const getCategoryTheme = (catId) => {
    return CATEGORIES.find(c => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
  };

  const isEventPast = (ev) => {
    const eventDateTime = new Date(`${ev.startDate}T${ev.endTime || ev.startTime || "23:59"}`);
    return eventDateTime < new Date();
  };

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="event-header flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-xl transition-colors hover:bg-white/5" style={{ color: "var(--text-secondary)" }} onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Events & Reminders</h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{activePatient?.name} &middot; Developmental Scheduler & Calendar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingEventId(null);
              setForm({
                title: "",
                category: "appointments",
                startDate: "",
                startTime: "",
                endDate: "",
                endTime: "",
                location: "",
                description: "",

              });
              setShowEventForm(p => !p);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg cursor-pointer"
            style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
          >
            <Plus className="w-4 h-4" /> Schedule Event
          </button>
        </div>
      </div>

      {/* Event Add/Edit Form */}
      {showEventForm && (
        <form onSubmit={handleSaveEvent} className="event-content p-6 rounded-2xl border backdrop-blur-sm shadow-xl space-y-4" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {editingEventId ? "Edit Event" : "Schedule New Event"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Event Title</label>
              <input
                type="text"
                placeholder="e.g. Pediatrician Follow-up"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id} className="bg-neutral-800">{c.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>End Date (Optional)</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>End Time (Optional)</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Location</label>
              <input
                type="text"
                placeholder="e.g. City Hospital, Room 302"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none"
              />
            </div>

          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Description & Notes</label>
            <textarea
              placeholder="Provide medication details, instructions, or appointment notes..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowEventForm(false); setEditingEventId(null); }}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer bg-transparent border-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
            >
              {editingEventId ? "Save Changes" : "Log Event"}
            </button>
          </div>
        </form>
      )}

      {/* Categories Filtering Grid */}
      <div className="event-content">
        <div className="flex flex-wrap gap-2 pb-2">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              filterCategory === "all" ? "bg-blue-500/25 border-blue-500 text-blue-300" : "bg-transparent border-white/5 text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            All Scheduled
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setFilterCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                filterCategory === c.id ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
              style={{
                borderColor: filterCategory === c.id ? c.color : "rgba(255,255,255,0.05)",
                color: filterCategory === c.id ? c.color : undefined
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Listings */}
      <div className="event-content space-y-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 rounded-2xl border border-l-[6px] space-y-3" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", borderLeftColor: "var(--card-border)" }}>
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-20 rounded-full" style={{ background: "var(--hover-bg)" }} />
                    <div className="flex gap-1">
                      <div className="w-7 h-7 rounded-lg" style={{ background: "var(--hover-bg)" }} />
                      <div className="w-7 h-7 rounded-lg" style={{ background: "var(--hover-bg)" }} />
                    </div>
                  </div>
                  <div className="h-5 w-3/4 rounded-lg" style={{ background: "var(--hover-bg)" }} />
                  <div className="space-y-1.5">
                    <div className="h-3 w-1/2 rounded" style={{ background: "var(--hover-bg)" }} />
                    <div className="h-3 w-2/5 rounded" style={{ background: "var(--hover-bg)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
            <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-neutral-500" />
            <p style={{ color: "var(--text-secondary)" }}>No upcoming reminders matching this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.map((ev) => {
              const theme = getCategoryTheme(ev.category);
              const past = isEventPast(ev);
              return (
                <div
                  key={ev.id}
                  className={`p-5 rounded-2xl border relative flex flex-col justify-between hover:shadow-md transition-all duration-300 border-l-[6px] ${past ? "opacity-60" : ""}`}
                  style={{
                    background: "var(--card-bg)",
                    borderColor: "var(--card-border)",
                    borderLeftColor: theme.color,
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: theme.bg, color: theme.color }}>
                        {theme.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditClick(ev)}
                          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/5 transition-colors bg-transparent border-none cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => triggerDeleteEvent(ev.id, ev.title)}
                          className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors bg-transparent border-none cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-bold text-base mb-2 text-white">{ev.title}</h4>

                    <div className="space-y-1.5 text-xs text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                        <span>
                          {new Date(ev.startDate).toLocaleDateString()} at {ev.startTime}
                          {ev.endDate && ev.endDate !== ev.startDate && ` - ${new Date(ev.endDate).toLocaleDateString()}`}
                          {ev.endTime && ev.endTime !== ev.startTime && ` at ${ev.endTime}`}
                        </span>
                      </div>
                      {ev.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                          <span>{ev.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-medium">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email reminder sent on event creation</span>
                        {ev.reminder_sent && (
                          <span className="text-green-400 ml-1">(sent)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {ev.description && (
                    <p className="mt-3 text-xs leading-relaxed text-neutral-300 border-t pt-3 border-white/5">
                      {ev.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (replaces window.confirm) */}
      <AnimatePresence>
        {deleteModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4"
                style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
              >
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Delete Event</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Are you sure you want to delete <span className="font-semibold text-white">"{deleteTargetTitle}"</span>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition-all cursor-pointer bg-transparent border-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDeleteEvent}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                  >
                    Delete Event
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
