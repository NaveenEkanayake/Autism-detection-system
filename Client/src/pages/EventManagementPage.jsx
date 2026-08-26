import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Tag, Plus, Edit2, Trash2, Bell, Share2, Check, AlertTriangle } from "lucide-react";
import { usePatients } from "../hooks/usePatients";
import { showToast } from "../components/ui/toast";

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
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    category: "appointments",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    description: "",
    reminderMinutes: "15",
  });

  const containerRef = useRef(null);

  // Load events
  useEffect(() => {
    if (!activePatient?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = JSON.parse(localStorage.getItem(`events_${activePatient.id}`) || "[]");
      // Sort by start date + time ascending
      const sorted = data.sort((a, b) => {
        const dtA = new Date(`${a.startDate}T${a.startTime || "00:00"}`);
        const dtB = new Date(`${b.startDate}T${b.startTime || "00:00"}`);
        return dtA - dtB;
      });
      setEvents(sorted);
    } catch (err) {
      console.error("Failed to load events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [activePatient?.id]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".event-header", { opacity: 0, y: 20, duration: 0.5, ease: "power3.out" });
      gsap.from(".event-content", { opacity: 0, y: 30, duration: 0.5, ease: "power2.out", delay: 0.2 });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const handleSaveEvent = (e) => {
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
      requestNotificationPermission();

      let updatedEvents = [];
      const newEvent = {
        id: editingEventId || `event-${Date.now()}`,
        patientId: activePatient.id,
        title: form.title.trim(),
        category: form.category,
        startDate: form.startDate,
        startTime: form.startTime,
        endDate: form.endDate || form.startDate,
        endTime: form.endTime || form.startTime,
        location: form.location.trim(),
        description: form.description.trim(),
        reminderMinutes: parseInt(form.reminderMinutes) || 15,
        updatedAt: new Date().toISOString(),
      };

      if (editingEventId) {
        updatedEvents = events.map(ev => ev.id === editingEventId ? newEvent : ev);
        showToast({ title: "Event Updated", description: `"${newEvent.title}" has been saved.`, type: "success" });
      } else {
        updatedEvents = [...events, newEvent];
        showToast({ title: "Event Logged", description: `"${newEvent.title}" has been scheduled.`, type: "success" });
      }

      // Sort
      updatedEvents.sort((a, b) => {
        const dtA = new Date(`${a.startDate}T${a.startTime}`);
        const dtB = new Date(`${b.startDate}T${b.startTime}`);
        return dtA - dtB;
      });

      setEvents(updatedEvents);
      localStorage.setItem(`events_${activePatient.id}`, JSON.stringify(updatedEvents));

      // Reset form
      setForm({
        title: "",
        category: "appointments",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        location: "",
        description: "",
        reminderMinutes: "15",
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
      location: ev.location,
      description: ev.description,
      reminderMinutes: String(ev.reminderMinutes),
    });
    setShowEventForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteEvent = (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      const updated = events.filter(ev => ev.id !== eventId);
      setEvents(updated);
      localStorage.setItem(`events_${activePatient.id}`, JSON.stringify(updated));
      showToast({ title: "Event Deleted", type: "success" });
    }
  };

  const getGoogleCalendarLink = (ev) => {
    // Dates formatted: YYYYMMDDTHHmmSSZ
    const getGCalDate = (dateStr, timeStr) => {
      const d = new Date(`${dateStr}T${timeStr || "00:00"}`);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = getGCalDate(ev.startDate, ev.startTime);
    const end = getGCalDate(ev.endDate || ev.startDate, ev.endTime || ev.startTime);
    
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${start}/${end}&details=${encodeURIComponent(ev.description || "")}&location=${encodeURIComponent(ev.location || "")}`;
  };

  const filteredEvents = filterCategory === "all" 
    ? events 
    : events.filter(e => e.category === filterCategory);

  const getCategoryTheme = (catId) => {
    return CATEGORIES.find(c => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
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
              reminderMinutes: "15",
            });
            setShowEventForm(p => !p);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg cursor-pointer"
          style={{ background: "linear-gradient(135deg, #3b93f5, #14b8a6)" }}
        >
          <Plus className="w-4 h-4" /> Schedule Event
        </button>
      </div>

      {/* Event Add/Edit Form */}
      {showEventForm && (
        <form onSubmit={handleSaveEvent} className="event-content p-6 rounded-2xl border backdrop-blur-sm shadow-xl space-y-4" style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}>
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {editingEventId ? "Edit Event / Reminder" : "Schedule New Event / Reminder"}
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
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Reminder Notification</label>
              <select
                value={form.reminderMinutes}
                onChange={(e) => setForm({ ...form, reminderMinutes: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none"
              >
                <option value="0" className="bg-neutral-800">At time of event</option>
                <option value="5" className="bg-neutral-800">5 minutes before</option>
                <option value="15" className="bg-neutral-800">15 minutes before</option>
                <option value="30" className="bg-neutral-800">30 minutes before</option>
                <option value="60" className="bg-neutral-800">1 hour before</option>
                <option value="1440" className="bg-neutral-800">1 day before</option>
              </select>
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
              onClick={() => {
                setShowEventForm(false);
                setEditingEventId(null);
              }}
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
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Loading scheduled events...</p>
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
              return (
                <div
                  key={ev.id}
                  className="p-5 rounded-2xl border relative flex flex-col justify-between hover:shadow-md transition-all duration-300 border-l-[6px]"
                  style={{
                    background: "var(--card-bg)",
                    borderColor: "var(--card-border)",
                    borderLeftColor: theme.color,
                  }}
                >
                  <div>
                    {/* Category tag */}
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: theme.bg, color: theme.color }}>
                        {theme.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <a
                          href={getGoogleCalendarLink(ev)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                          title="Sync to Google Calendar"
                        >
                          <Share2 className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleEditClick(ev)}
                          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/5 transition-colors bg-transparent border-none cursor-pointer"
                          title="Edit Event"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
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
                      {ev.reminderMinutes !== 0 && (
                        <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-medium">
                          <Bell className="w-3.5 h-3.5" />
                          <span>Notification scheduled {ev.reminderMinutes}m before</span>
                        </div>
                      )}
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
    </div>
  );
}
