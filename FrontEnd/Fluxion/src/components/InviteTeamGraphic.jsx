import { useState } from "react";

const ROLES = [
    { label: "Admin", icon: "🛡️", color: "#6366f1", desc: "Full access" },
    { label: "Technician", icon: "🔧", color: "#f59e0b", desc: "Manage assets" },
    { label: "User", icon: "👤", color: "#10b981", desc: "View only" },
];

const AVATARS = ["🧑💻", "👩💼", "🧑🔧", "👨💼", "👩💻", "🧑🏭"];

function Avatar({ emoji, role }) {
    const r = ROLES.find(r => r.label === role);
    return (
        <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                border: `2px solid ${r?.color || "#2e3d50"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
            }}>{emoji}</div>
            <div style={{
                position: "absolute", bottom: -1, right: -1,
                width: 10, height: 10, borderRadius: "50%",
                background: r?.color || "#2e3d50",
                border: "2px solid #0e1420",
            }} />
        </div>
    );
}

function EmailPulse() {
    return (
        <div style={{ position: "relative", width: 48, height: 48 }}>
            {[0, 1, 2].map(i => (
                <div key={i} style={{
                    position: "absolute", inset: 0,
                    borderRadius: "50%",
                    border: "1px solid rgba(99,102,241,0.4)",
                    animation: `ripple 2s ease-out ${i * 0.6}s infinite`,
                }} />
            ))}
            <div style={{
                position: "absolute", inset: 8,
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
            }}>✉️</div>
        </div>
    );
}

export default function InviteTeamGraphic() {
    const [invited, setInvited] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", role: "User", tempPass: "" });
    const [sending, setSending] = useState(false);
    const [justInvited, setJustInvited] = useState(null);

    const genPass = () => {
        const pass = "Tmp@" + Math.random().toString(36).slice(2, 7).toUpperCase();
        setForm(f => ({ ...f, tempPass: pass }));
    };

    const handleInvite = () => {
        if (!form.name.trim() || !form.email.trim()) return;
        setSending(true);
        setTimeout(() => {
            const id = Date.now();
            const emoji = AVATARS[Math.floor(Math.random() * AVATARS.length)];
            setInvited(prev => [{ ...form, id, emoji, sent: true }, ...prev]);
            setJustInvited(id);
            setForm({ name: "", email: "", role: "User", tempPass: "" });
            setShowForm(false);
            setSending(false);
            setTimeout(() => setJustInvited(null), 2500);
        }, 1400);
    };

    const inputStyle = {
        width: "100%", boxSizing: "border-box",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8, padding: "9px 12px",
        color: "#e2e8f0", fontSize: 12,
        fontFamily: "inherit", outline: "none",
    };

    return (
        <div style={{
            width: "100%",
            fontFamily: "inherit",
        }}>

            <div style={{
                width: "100%", aspectRatio: "1",
                background: "linear-gradient(145deg, #0e1420, #0a1018)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 24,
                padding: 16,
                boxSizing: "border-box",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
                display: "flex", flexDirection: "column",
            }}>

                {/* Glow */}
                <div style={{
                    position: "absolute", top: -80, left: -40,
                    width: 240, height: 240,
                    background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", bottom: -60, right: 40,
                    width: 180, height: 180,
                    background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            background: "rgba(245,158,11,0.12)",
                            border: "1px solid rgba(245,158,11,0.22)",
                            borderRadius: 20, padding: "4px 10px",
                            fontSize: 9, color: "#f59e0b", fontWeight: 600,
                            letterSpacing: "0.06em", marginBottom: 8,
                        }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                            PENDING
                        </div>
                        <h2 style={{
                            margin: 0, fontSize: 16, fontWeight: 700,
                            color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2,
                        }}>Invite Your Team</h2>
                        <p style={{ margin: "4px 0 0", fontSize: 10, color: "#3d4d60", lineHeight: 1.5 }}>
                            Roles are emailed instantly with<br />a temp password to change on login.
                        </p>
                    </div>

                    <EmailPulse />
                </div>

                {/* Role pills */}
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                    {ROLES.map(r => (
                        <div key={r.label} style={{
                            flex: 1,
                            background: "rgba(255,255,255,0.03)",
                            border: `1px solid ${r.color}28`,
                            borderRadius: 10, padding: "6px 4px",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                        }}>
                            <div style={{ fontSize: 13, marginBottom: 2 }}>{r.icon}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: r.color }}>{r.label}</div>
                            <div style={{ fontSize: 8, color: "#4f637a" }}>{r.desc}</div>
                        </div>
                    ))}
                </div>

                {/* Steps Mini */}
                <div style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 10, padding: "10px",
                    marginBottom: 10,
                }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {[
                            ["1", "Name, email & role"],
                            ["2", "Set temp password"],
                            ["3", "Email sent instantly"],
                            ["4", "They reset on login"],
                        ].reduce((acc, curr, i, arr) => {
                            if (i % 2 === 0) acc.push([curr, arr[i + 1]]);
                            return acc;
                        }, []).map((pair, idx) => (
                            <div key={idx} style={{ display: "flex", gap: 12 }}>
                                {pair.map(item => item && (
                                    <div key={item[0]} style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
                                        <div style={{
                                            width: 14, height: 14, borderRadius: "50%",
                                            background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
                                            color: "#6366f1", fontSize: 8, fontWeight: 700,
                                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                        }}>{item[0]}</div>
                                        <span style={{ fontSize: 9, color: "#4a5d70", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item[1]}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team roster preview */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                    {invited.slice(0, 2).map(u => {
                        const r = ROLES.find(r => r.label === u.role);
                        return (
                            <div key={u.id} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                background: justInvited === u.id ? "rgba(99,102,241,0.07)" : "rgba(255,255,255,0.02)",
                                border: `1px solid ${justInvited === u.id ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)"}`,
                                borderRadius: 10, padding: "9px 12px",
                                transition: "all 0.4s",
                            }}>
                                <Avatar emoji={u.emoji} role={u.role} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                                    <div style={{ fontSize: 11, color: "#2e3d50", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                                </div>
                                <div style={{
                                    fontSize: 10, color: r?.color,
                                    background: `${r?.color}18`,
                                    border: `1px solid ${r?.color}30`,
                                    borderRadius: 6, padding: "3px 8px", fontWeight: 600, flexShrink: 0,
                                }}>{r?.icon} {u.role}</div>
                                <div style={{
                                    fontSize: 10, color: "#10b981",
                                    background: "rgba(16,185,129,0.08)",
                                    border: "1px solid rgba(16,185,129,0.2)",
                                    borderRadius: 6, padding: "3px 8px", fontWeight: 600, flexShrink: 0,
                                }}>Sent ✓</div>
                            </div>
                        );
                    })}
                    {invited.length > 2 && (
                        <div style={{ textAlign: "center", fontSize: 11, color: "#2e3d50" }}>+{invited.length - 2} more invited</div>
                    )}
                </div>

                {/* CTA */}
                {!showForm && (
                    <button onClick={() => setShowForm(true)} style={{
                        width: "100%", padding: "10px 16px",
                        background: "rgba(255,255,255,0.05)",
                        border: "none", borderRadius: 10,
                        color: "#e2e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        transition: "all 0.2s", marginTop: "auto",
                    }}>
                        + Invite User
                    </button>
                )}

                {/* Overlaid Form */}
                {showForm && (
                    <div style={{
                        position: "absolute", inset: 0,
                        background: "rgba(7,9,15,0.97)",
                        borderRadius: 24, padding: 20,
                        display: "flex", flexDirection: "column", gap: 6,
                        zIndex: 10,
                        animation: "fadeIn 0.2s ease",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>Send Invite</span>
                            <button onClick={() => setShowForm(false)} style={{
                                background: "none", border: "none", color: "#3d4d60", cursor: "pointer",
                                fontSize: 18, fontFamily: "inherit", lineHeight: 1,
                            }}>×</button>
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 9, color: "#3d4d60", display: "block", marginBottom: 3, fontWeight: 500 }}>Name *</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Sarah Chen" style={{ ...inputStyle, padding: "7px 10px", fontSize: 11 }} autoFocus />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 9, color: "#3d4d60", display: "block", marginBottom: 3, fontWeight: 500 }}>Role</label>
                                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                    style={{ ...inputStyle, cursor: "pointer", padding: "7px 10px", fontSize: 11 }}>
                                    {ROLES.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: 9, color: "#3d4d60", display: "block", marginBottom: 3, fontWeight: 500 }}>Email Address *</label>
                            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="sarah@company.com" type="email" style={{ ...inputStyle, padding: "7px 10px", fontSize: 11 }} />
                        </div>

                        <div>
                            <label style={{ fontSize: 9, color: "#3d4d60", display: "flex", justifyContent: "space-between", marginBottom: 3, fontWeight: 500 }}>
                                Temp Password
                                <span onClick={genPass} style={{ color: "#6366f1", cursor: "pointer" }}>Generate</span>
                            </label>
                            <input value={form.tempPass} readOnly placeholder="Click Generate..."
                                style={{ ...inputStyle, fontFamily: "inherit", color: "#10b981", padding: "7px 10px", fontSize: 11 }} />
                        </div>

                        <button onClick={handleInvite} disabled={!form.name || !form.email || sending} style={{
                            width: "100%", padding: "10px 16px",
                            background: (form.name && form.email) ? "#6366f1" : "rgba(255,255,255,0.05)",
                            border: "none", borderRadius: 10,
                            color: (form.name && form.email) ? "#fff" : "#9ca3af",
                            fontSize: 12, fontWeight: 600, cursor: (form.name && form.email && !sending) ? "pointer" : "default",
                            transition: "all 0.2s", marginTop: "auto",
                        }}>
                            {sending ? "Sending Email..." : "Send Invite"}
                        </button>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus, select:focus {
          border-color: rgba(99,102,241,0.4) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08) !important;
        }
        select option { background: #0e1420; color: #e2e8f0; }
      `}</style>
        </div >
    );
}
