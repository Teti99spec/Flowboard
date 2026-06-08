import { useState, useRef, useEffect } from "react";

// ============================================================
// FLOWBOARD — Phase 2: Auth + Supabase
// ============================================================

const SUPABASE_URL = "https://felnjscyzwykejoxtmmr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlbG5qc2N5end5a2Vqb3h0bW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjM0NDgsImV4cCI6MjA5NjQzOTQ0OH0.yTByLrYprsH8bKEyhviujL7fdrsXkBQXNyWia_BYZMo";

const api = async (path, opts = {}) => {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${opts.token || SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  try { return { ok: res.ok, data: JSON.parse(text), status: res.status }; }
  catch { return { ok: res.ok, data: text, status: res.status }; }
};

// Auth helpers
const auth = {
  async signUp(email, password) {
    return api("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email, password }) });
  },
  async signIn(email, password) {
    return api("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
  },
  async signOut(token) {
    return api("/auth/v1/logout", { method: "POST", token });
  },
};

// DB helpers
const db = {
  async getTasks(token, userId) {
    return api(`/rest/v1/tasks?user_id=eq.${userId}&order=created_at.desc`, { token, headers: { Prefer: "return=representation" } });
  },
  async createTask(token, task) {
    return api("/rest/v1/tasks", { method: "POST", token, body: JSON.stringify(task), headers: { Prefer: "return=representation" } });
  },
  async updateTask(token, id, changes) {
    return api(`/rest/v1/tasks?id=eq.${id}`, { method: "PATCH", token, body: JSON.stringify(changes) });
  },
  async deleteTask(token, id) {
    return api(`/rest/v1/tasks?id=eq.${id}`, { method: "DELETE", token });
  },
};

// ============================================================
// CONSTANTS
// ============================================================
const COLORS = {
  bg: "#0a0a0f", surface: "#111118", card: "#16161f", border: "#1e1e2e",
  accent: "#6c63ff", accentSoft: "#6c63ff22", accentHover: "#7c74ff",
  green: "#22c55e", yellow: "#f59e0b", red: "#ef4444", blue: "#3b82f6",
  textPrimary: "#f0f0ff", textSecondary: "#8888aa", textMuted: "#44445a",
};

const PRIORITIES = {
  urgent: { label: "Urgent", color: "#ef4444", icon: "🔴" },
  high:   { label: "High",   color: "#f59e0b", icon: "🟠" },
  medium: { label: "Medium", color: "#6c63ff", icon: "🟣" },
  low:    { label: "Low",    color: "#22c55e", icon: "🟢" },
};

const LABELS = ["Feature", "Bug", "Design", "Docs", "Research", "Chore"];

const COLUMNS = [
  { id: "backlog",    label: "Backlog",     color: "#44445a" },
  { id: "todo",       label: "To Do",       color: "#6c63ff" },
  { id: "inprogress", label: "In Progress", color: "#f59e0b" },
  { id: "review",     label: "Review",      color: "#3b82f6" },
  { id: "done",       label: "Done",        color: "#22c55e" },
];

const selectStyle = {
  background: "#16161f", border: "1px solid #1e1e2e", borderRadius: 8,
  color: "#f0f0ff", fontSize: 13, padding: "6px 10px",
  outline: "none", cursor: "pointer", fontFamily: "inherit",
};

const inputStyle = {
  width: "100%", background: "#111118", border: "1px solid #1e1e2e",
  borderRadius: 12, color: "#f0f0ff", fontSize: 15, padding: "14px 16px",
  outline: "none", fontFamily: "inherit", transition: "border 0.15s",
};

// ============================================================
// AUTH SCREEN
// ============================================================
const AuthScreen = ({ onAuth }) => {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) { setError("Fill in both fields 👀"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError(""); setSuccess("");

    if (mode === "signup") {
      const res = await auth.signUp(email, password);
      if (res.ok) {
        setSuccess("Account created! Check your email to confirm, then log in 🎉");
        setMode("login");
      } else {
        setError(res.data?.msg || res.data?.message || "Signup failed. Try again.");
      }
    } else {
      const res = await auth.signIn(email, password);
      if (res.ok && res.data?.access_token) {
        onAuth({ token: res.data.access_token, user: res.data.user });
      } else {
        setError(res.data?.error_description || res.data?.message || "Wrong email or password.");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: 20,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 420,
        animation: "slideUp 0.3s ease",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "linear-gradient(135deg, #6c63ff, #a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 900, color: "#fff", margin: "0 auto 14px",
            boxShadow: "0 8px 32px #6c63ff44",
          }}>F</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.textPrimary }}>Flowboard</h1>
          <p style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 6 }}>
            {mode === "login" ? "Welcome back 👋" : "Create your account ✨"}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 14,
          boxShadow: "0 16px 48px #00000055",
        }}>
          {error && (
            <div style={{ background: "#ef444418", border: "1px solid #ef444433", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: "#22c55e18", border: "1px solid #22c55e33", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#22c55e" }}>
              {success}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" style={inputStyle}
              onFocus={e => e.target.style.borderColor = COLORS.accent}
              onBlur={e => e.target.style.borderColor = COLORS.border}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters" style={inputStyle}
              onFocus={e => e.target.style.borderColor = COLORS.accent}
              onBlur={e => e.target.style.borderColor = COLORS.border}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{
            background: loading ? COLORS.border : COLORS.accent,
            border: "none", borderRadius: 12, color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
            padding: "14px", fontSize: 15, fontWeight: 700,
            marginTop: 4, transition: "background 0.15s",
          }}>
            {loading ? "Please wait..." : mode === "login" ? "Log in →" : "Create account →"}
          </button>

          <div style={{ textAlign: "center", fontSize: 13, color: COLORS.textSecondary, paddingTop: 4 }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setSuccess(""); }}
              style={{ color: COLORS.accent, cursor: "pointer", fontWeight: 700 }}>
              {mode === "login" ? "Sign up" : "Log in"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SMALL COMPONENTS
// ============================================================
const PriorityBadge = ({ priority }) => {
  const p = PRIORITIES[priority] || PRIORITIES.medium;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: p.color, background: p.color + "18", borderRadius: 6, padding: "2px 7px" }}>
      {p.icon} {p.label}
    </span>
  );
};

const LabelBadge = ({ label }) => (
  <span style={{ fontSize: 11, color: COLORS.textSecondary, background: COLORS.border, borderRadius: 6, padding: "2px 7px" }}>{label}</span>
);

const ProgressBar = ({ tasks }) => {
  const done = tasks.filter(t => t.status === "done").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
      <div style={{ flex: 1, height: 5, background: COLORS.border, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: COLORS.green, borderRadius: 99, transition: "width 0.5s" }} />
      </div>
      <span style={{ fontSize: 12, color: COLORS.textSecondary, minWidth: 32 }}>{pct}%</span>
    </div>
  );
};

const StatCard = ({ label, value, color, icon }) => (
  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 130 }}>
    <div style={{ width: 42, height: 42, borderRadius: 12, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.textPrimary }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{label}</div>
    </div>
  </div>
);

const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
    <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.accent}`, animation: "spin 0.7s linear infinite" }} />
  </div>
);

// ============================================================
// TASK MODAL
// ============================================================
const TaskModal = ({ task, onClose, onSave, onDelete, isNew }) => {
  const [t, setT] = useState(task);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const field = (key, val) => setT(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!t.title?.trim()) return;
    setSaving(true);
    await onSave(t);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(4px)", animation: "fadeIn 0.15s ease" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 18, width: "100%", maxWidth: 580, padding: 28, display: "flex", flexDirection: "column", gap: 18, boxShadow: "0 24px 64px #00000066", animation: "slideUp 0.2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <textarea value={t.title} onChange={e => field("title", e.target.value)}
            style={{ background: "none", border: "none", outline: "none", color: COLORS.textPrimary, fontSize: 20, fontWeight: 700, fontFamily: "inherit", resize: "none", flex: 1, lineHeight: 1.3 }}
            rows={2} placeholder="Task title..." />
          <button onClick={onClose} style={{ background: COLORS.border, border: "none", borderRadius: 8, color: COLORS.textSecondary, cursor: "pointer", padding: "4px 10px", fontSize: 16, marginLeft: 8 }}>✕</button>
        </div>

        <textarea placeholder="Add a description..." value={t.description || ""} onChange={e => field("description", e.target.value)}
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textSecondary, fontSize: 14, fontFamily: "inherit", resize: "none", padding: 12, outline: "none", minHeight: 80 }}
          rows={3} />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select value={t.status} onChange={e => field("status", e.target.value)} style={selectStyle}>
            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={t.priority} onChange={e => field("priority", e.target.value)} style={selectStyle}>
            {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <select value={t.label || ""} onChange={e => field("label", e.target.value)} style={selectStyle}>
            <option value="">No label</option>
            {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <input type="date" value={t.due || ""} onChange={e => field("due", e.target.value)} style={{ ...selectStyle, colorScheme: "dark" }} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {!isNew && (
            <button onClick={() => { onDelete(t.id); onClose(); }} style={{ background: "#ef444418", border: "1px solid #ef444433", borderRadius: 10, color: "#ef4444", cursor: "pointer", padding: "9px 18px", fontSize: 14, fontWeight: 600 }}>Delete</button>
          )}
          <button onClick={handleSave} disabled={saving} style={{ background: saving ? COLORS.border : COLORS.accent, border: "none", borderRadius: 10, color: "#fff", cursor: saving ? "not-allowed" : "pointer", padding: "9px 24px", fontSize: 14, fontWeight: 700, flex: 1 }}>
            {saving ? "Saving..." : isNew ? "Create task" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// QUICK ADD
// ============================================================
const QuickAdd = ({ defaultStatus, onAdd, onCancel }) => {
  const [title, setTitle] = useState("");
  const ref = useRef();
  useEffect(() => { ref.current?.focus(); }, []);

  const submit = () => {
    if (!title.trim()) { onCancel(); return; }
    onAdd({ title: title.trim(), status: defaultStatus, priority: "medium", label: "", due: "", description: "" });
  };

  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.accent}44`, borderRadius: 12, padding: "10px 12px", display: "flex", gap: 8 }}>
      <input ref={ref} value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
        placeholder="Task title... (Enter to save)"
        style={{ flex: 1, background: "none", border: "none", outline: "none", color: COLORS.textPrimary, fontSize: 14, fontFamily: "inherit" }} />
      <button onClick={submit} style={{ background: COLORS.accent, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", padding: "4px 12px", fontSize: 13, fontWeight: 700 }}>Add</button>
    </div>
  );
};

// ============================================================
// KANBAN
// ============================================================
const KanbanCard = ({ task, onClick, onDragStart }) => (
  <div draggable onDragStart={e => onDragStart(e, task.id)} onClick={() => onClick(task)}
    style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 10 }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent + "66"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 20px ${COLORS.accent}18`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
  >
    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, lineHeight: 1.4 }}>{task.title}</div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <PriorityBadge priority={task.priority} />
      {task.label && <LabelBadge label={task.label} />}
    </div>
    {task.due && <span style={{ fontSize: 11, color: COLORS.textMuted }}>📅 {new Date(task.due).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
  </div>
);

const KanbanView = ({ tasks, onTaskClick, onTaskUpdate, onTaskAdd }) => {
  const [adding, setAdding] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  return (
    <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 16, minHeight: "calc(100vh - 280px)" }}>
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div key={col.id}
            onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => { const id = e.dataTransfer.getData("taskId"); onTaskUpdate(id, { status: col.id }); setDragOver(null); }}
            style={{ minWidth: 270, width: 270, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, background: dragOver === col.id ? COLORS.accentSoft : "transparent", borderRadius: 14, padding: 4, transition: "background 0.15s" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 4px 0" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.color }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 }}>{col.label}</span>
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: COLORS.textMuted, background: COLORS.border, borderRadius: 99, padding: "1px 8px" }}>{colTasks.length}</span>
            </div>
            {colTasks.map(task => (
              <KanbanCard key={task.id} task={task} onClick={onTaskClick}
                onDragStart={(e, id) => e.dataTransfer.setData("taskId", String(id))} />
            ))}
            {adding === col.id
              ? <QuickAdd defaultStatus={col.id} onAdd={t => { onTaskAdd(t); setAdding(null); }} onCancel={() => setAdding(null)} />
              : <button onClick={() => setAdding(col.id)}
                  style={{ background: "none", border: `1px dashed ${COLORS.border}`, borderRadius: 10, color: COLORS.textMuted, cursor: "pointer", padding: "8px 0", fontSize: 13, transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent + "88"; e.currentTarget.style.color = COLORS.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textMuted; }}
                >+ Add task</button>
            }
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// LIST VIEW
// ============================================================
const ListView = ({ tasks, onTaskClick, onTaskUpdate }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 100px 90px", padding: "8px 16px", fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.8, borderBottom: `1px solid ${COLORS.border}` }}>
      <span>Task</span><span>Status</span><span>Priority</span><span>Due</span>
    </div>
    {COLUMNS.map(col => {
      const colTasks = tasks.filter(t => t.status === col.id);
      if (!colTasks.length) return null;
      return (
        <div key={col.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px 6px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 }}>{col.label} ({colTasks.length})</span>
          </div>
          {colTasks.map(task => (
            <div key={task.id} onClick={() => onTaskClick(task)}
              style={{ display: "grid", gridTemplateColumns: "1fr 110px 100px 90px", padding: "12px 16px", cursor: "pointer", borderRadius: 10, transition: "all 0.1s", alignItems: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.card}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={task.status === "done"}
                  onChange={e => { e.stopPropagation(); onTaskUpdate(task.id, { status: e.target.checked ? "done" : "todo" }); }}
                  onClick={e => e.stopPropagation()}
                  style={{ accentColor: COLORS.accent, width: 16, height: 16 }} />
                <span style={{ fontSize: 14, color: task.status === "done" ? COLORS.textMuted : COLORS.textPrimary, textDecoration: task.status === "done" ? "line-through" : "none", fontWeight: 500 }}>{task.title}</span>
                {task.label && <LabelBadge label={task.label} />}
              </div>
              <span style={{ fontSize: 12, color: COLUMNS.find(c => c.id === task.status)?.color, fontWeight: 600 }}>{COLUMNS.find(c => c.id === task.status)?.label}</span>
              <PriorityBadge priority={task.priority} />
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>{task.due ? new Date(task.due).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</span>
            </div>
          ))}
        </div>
      );
    })}
  </div>
);

// ============================================================
// MAIN BOARD
// ============================================================
const Board = ({ session, onSignOut }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("kanban");
  const [selectedTask, setSelectedTask] = useState(null);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [showNewTask, setShowNewTask] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { token, user } = session;

  useEffect(() => {
    db.getTasks(token, user.id).then(res => {
      setTasks(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  const addTask = async (taskData) => {
    const res = await db.createTask(token, { ...taskData, user_id: user.id });
    if (res.ok && res.data?.[0]) setTasks(prev => [res.data[0], ...prev]);
  };

  const updateTask = async (idOrTask, changes) => {
    if (typeof idOrTask === "object") {
      const { id, ...rest } = idOrTask;
      await db.updateTask(token, id, rest);
      setTasks(prev => prev.map(t => t.id === id ? idOrTask : t));
    } else {
      await db.updateTask(token, idOrTask, changes);
      setTasks(prev => prev.map(t => t.id === idOrTask ? { ...t, ...changes } : t));
    }
  };

  const deleteTask = async (id) => {
    await db.deleteTask(token, id);
    setTasks(prev => prev.filter(t => t.id !== id));
    setSelectedTask(null);
  };

  const handleSignOut = async () => {
    await auth.signOut(token);
    onSignOut();
  };

  const done   = tasks.filter(t => t.status === "done").length;
  const inprog = tasks.filter(t => t.status === "inprogress").length;
  const urgent = tasks.filter(t => t.priority === "urgent").length;
  const total  = tasks.length;

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: COLORS.textPrimary }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0f; }
        ::-webkit-scrollbar-thumb { background: #1e1e2e; border-radius: 99px; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes spin { to { transform: rotate(360deg) } }
        textarea, input, select, button { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "#00000066", zIndex: 200, backdropFilter: "blur(2px)", animation: "fadeIn 0.15s ease" }} />}

      {/* SIDEBAR */}
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 240, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", padding: "20px 0", zIndex: 300, transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)", boxShadow: sidebarOpen ? "4px 0 32px #00000055" : "none" }}>
        <div style={{ padding: "0 16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #6c63ff, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff" }}>F</div>
            <span style={{ fontSize: 18, fontWeight: 800, color: COLORS.textPrimary }}>Flowboard</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: COLORS.border, border: "none", borderRadius: 8, color: COLORS.textSecondary, cursor: "pointer", width: 30, height: 30, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* User info */}
        <div style={{ margin: "0 16px 20px", padding: "12px 14px", background: COLORS.accentSoft, borderRadius: 12, border: `1px solid ${COLORS.accent}33` }}>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 2 }}>Logged in as</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, wordBreak: "break-all" }}>{user.email}</div>
        </div>

        {[
          { icon: "⚡", label: "My Work", active: true },
          { icon: "📋", label: "Projects" },
          { icon: "🏃", label: "Sprints" },
          { icon: "📊", label: "Reports" },
          { icon: "⚙️", label: "Settings" },
        ].map(item => (
          <div key={item.label} onClick={() => setSidebarOpen(false)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", cursor: "pointer", background: item.active ? COLORS.accentSoft : "none", borderLeft: item.active ? `3px solid ${COLORS.accent}` : "3px solid transparent", color: item.active ? COLORS.accent : COLORS.textSecondary, fontSize: 15, fontWeight: item.active ? 700 : 500, transition: "all 0.15s" }}
            onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = COLORS.card; e.currentTarget.style.color = COLORS.textPrimary; } }}
            onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = COLORS.textSecondary; } }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}

        {/* Sign out */}
        <div style={{ marginTop: "auto", padding: "0 16px" }}>
          <button onClick={handleSignOut} style={{ width: "100%", background: "#ef444418", border: "1px solid #ef444433", borderRadius: 10, color: "#ef4444", cursor: "pointer", padding: "10px", fontSize: 14, fontWeight: 600 }}>
            🚪 Sign out
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ padding: "20px 20px 40px" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textPrimary, cursor: "pointer", width: 40, height: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, flexShrink: 0, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent + "88"; e.currentTarget.style.background = COLORS.accentSoft; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = COLORS.card; }}
          >
            <div style={{ width: 16, height: 2, background: COLORS.textPrimary, borderRadius: 99 }} />
            <div style={{ width: 12, height: 2, background: COLORS.textPrimary, borderRadius: 99 }} />
            <div style={{ width: 16, height: 2, background: COLORS.textPrimary, borderRadius: 99 }} />
          </button>

          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: COLORS.textPrimary }}>My Work</h1>
            <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>Sprint 1 · June 2026</p>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "8px 14px", gap: 8, minWidth: 180 }}>
            <span style={{ color: COLORS.textMuted }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
              style={{ background: "none", border: "none", outline: "none", color: COLORS.textPrimary, fontSize: 14, width: "100%", fontFamily: "inherit" }} />
          </div>

          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={selectStyle}>
            <option value="all">All priorities</option>
            {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>

          <button onClick={() => setShowNewTask(true)} style={{ background: COLORS.accent, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", padding: "10px 20px", fontSize: 14, fontWeight: 700, transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.accentHover}
            onMouseLeave={e => e.currentTarget.style.background = COLORS.accent}
          >+ New Task</button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard label="Total Tasks" value={total}  color={COLORS.accent} icon="📝" />
          <StatCard label="In Progress" value={inprog} color={COLORS.yellow} icon="🏃" />
          <StatCard label="Completed"   value={done}   color={COLORS.green}  icon="✅" />
          <StatCard label="Urgent"      value={urgent} color={COLORS.red}    icon="🔴" />
        </div>

        {/* Progress */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: COLORS.textSecondary, whiteSpace: "nowrap" }}>Sprint progress</span>
          <ProgressBar tasks={tasks} />
          <span style={{ fontSize: 13, color: COLORS.textSecondary, whiteSpace: "nowrap" }}>{done}/{total} done</span>
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {[{ id: "kanban", label: "⬜ Kanban" }, { id: "list", label: "☰ List" }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{ background: view === v.id ? COLORS.accent : COLORS.card, border: `1px solid ${view === v.id ? COLORS.accent : COLORS.border}`, borderRadius: 8, color: view === v.id ? "#fff" : COLORS.textSecondary, cursor: "pointer", padding: "7px 16px", fontSize: 13, fontWeight: 600, transition: "all 0.15s" }}>{v.label}</button>
          ))}
        </div>

        {/* Board */}
        {loading ? <Spinner /> : view === "kanban"
          ? <KanbanView tasks={filtered} onTaskClick={setSelectedTask} onTaskUpdate={updateTask} onTaskAdd={addTask} />
          : <ListView tasks={filtered} onTaskClick={setSelectedTask} onTaskUpdate={updateTask} />
        }

        {!loading && tasks.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 8 }}>No tasks yet</div>
            <div style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 }}>Create your first task to get started</div>
            <button onClick={() => setShowNewTask(true)} style={{ background: COLORS.accent, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", padding: "12px 28px", fontSize: 15, fontWeight: 700 }}>+ Create first task</button>
          </div>
        )}
      </div>

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} onSave={updateTask} onDelete={deleteTask} />}
      {showNewTask && <TaskModal task={{ title: "", status: "todo", priority: "medium", label: "", due: "", description: "" }} onClose={() => setShowNewTask(false)} onSave={addTask} onDelete={() => setShowNewTask(false)} isNew />}
    </div>
  );
};

// ============================================================
// ROOT — switches between Auth and Board
// ============================================================
export default function App() {
  const [session, setSession] = useState(null);

  return session
    ? <Board session={session} onSignOut={() => setSession(null)} />
    : <AuthScreen onAuth={setSession} />;
}
