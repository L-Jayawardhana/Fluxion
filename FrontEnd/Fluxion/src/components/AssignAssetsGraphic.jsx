import { useState } from "react";

const ASSETS = [
    { id: 1, name: "MacBook Pro 14\"", type: "💻", code: "AST-4K2PQ" },
    { id: 2, name: "HP LaserJet Pro", type: "🖨️", code: "AST-9X1MR" },
    { id: 3, name: "Toyota Hilux", type: "🚗", code: "AST-7B3NF" },
    { id: 4, name: "Dell Monitor 27\"", type: "🖥️", code: "AST-2W8JZ" },
    { id: 5, name: "iPhone 15 Pro", type: "📱", code: "AST-5L6VT" },
];

const USERS = [
    { id: 1, name: "Sarah Chen", role: "Admin", emoji: "👩💼", dept: "IT" },
    { id: 2, name: "Marcus Lee", role: "Technician", emoji: "🧑🔧", dept: "Logistics" },
    { id: 3, name: "Priya Nair", role: "User", emoji: "👩💻", dept: "Finance" },
    { id: 4, name: "James Osei", role: "User", emoji: "👨💼", dept: "Operations" },
];

const ROLE_COLORS = { Admin: "#6366f1", Technician: "#f59e0b", User: "#10b981" };

function LinkLine({ active }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 0, position: "relative", width: 40, flexShrink: 0,
        }}>
            {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: active ? "#6366f1" : "rgba(255,255,255,0.08)",
                    margin: "0 1px",
                    animation: active ? `dotPulse 1.2s ease-in-out ${i * 0.15}s infinite` : "none",
                    transition: "background 0.3s",
                }} />
            ))}
            {active && (
                <div style={{
                    position: "absolute", right: -2,
                    fontSize: 10, color: "#6366f1",
                }}>▶</div>
            )}
        </div>
    );
}

export default function AssignAssetsGraphic() {
    const [assignments, setAssignments] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ assetId: "", userId: "", date: "", notes: "" });
    const [assigning, setAssigning] = useState(false);
    const [justAssigned, setJustAssigned] = useState(null);
    const animLink = !!(form.assetId && form.userId);

    const handleAssign = () => {
        if (!form.assetId || !form.userId) return;
        setAssigning(true);
        setTimeout(() => {
            const asset = ASSETS.find(a => a.id === +form.assetId);
            const user = USERS.find(u => u.id === +form.userId);
            const id = Date.now();
            setAssignments(prev => [{ ...form, asset, user, id }, ...prev]);
            setJustAssigned(id);
            setForm({ assetId: "", userId: "", date: "", notes: "" });
            setShowForm(false);
            setAssigning(false);
            setTimeout(() => setJustAssigned(null), 2500);
        }, 1200);
    };

    const selStyle = {
        width: "100%", boxSizing: "border-box",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8, padding: "9px 12px",
        color: "#e2e8f0", fontSize: 12,
        fontFamily: "inherit", outline: "none", cursor: "pointer",
    };

    const selectedAsset = ASSETS.find(a => a.id === +form.assetId);
    const selectedUser = USERS.find(u => u.id === +form.userId);

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

                {/* Glows */}
                <div style={{
                    position: "absolute", top: -60, right: -60, width: 220, height: 220,
                    background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", bottom: -60, left: 20, width: 180, height: 180,
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
                        }}>Assign Assets</h2>
                        <p style={{ margin: "4px 0 0", fontSize: 10, color: "#3d4d60", lineHeight: 1.5 }}>
                            Link assets to users. Full history<br />is tracked automatically.
                        </p>
                    </div>

                    {/* Visual: asset→user link icon */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 4,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 14, padding: "10px 14px",
                    }}>
                        <div style={{ fontSize: 20 }}>📦</div>
                        <div style={{ display: "flex", gap: 2 }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} style={{
                                    width: 4, height: 4, borderRadius: "50%",
                                    background: "rgba(99,102,241,0.5)",
                                    animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                                }} />
                            ))}
                        </div>
                        <div style={{ fontSize: 20 }}>👤</div>
                    </div>
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
                            ["1", "Select asset & user"],
                            ["2", "Set assignment date"],
                            ["3", "Add optional notes"],
                            ["4", "Appears in user dashboard"],
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
                                            color: "#818cf8", fontSize: 8, fontWeight: 700,
                                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                        }}>{item[0]}</div>
                                        <span style={{ fontSize: 9, color: "#4a5d70", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item[1]}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Assignment list */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                    {assignments.slice(0, 2).map(a => {
                        const roleColor = ROLE_COLORS[a.user?.role] || "#6366f1";
                        return (
                            <div key={a.id} style={{
                                display: "flex", alignItems: "center", gap: 10,
                                background: justAssigned === a.id ? "rgba(99,102,241,0.07)" : "rgba(255,255,255,0.02)",
                                border: `1px solid ${justAssigned === a.id ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.05)"}`,
                                borderRadius: 10, padding: "9px 12px", marginBottom: 6,
                                transition: "all 0.4s",
                            }}>
                                {/* Asset */}
                                <div style={{
                                    width: 28, height: 28, borderRadius: 8,
                                    background: "rgba(99,102,241,0.1)",
                                    border: "1px solid rgba(99,102,241,0.2)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 14, flexShrink: 0,
                                }}>{a.asset?.type}</div>

                                {/* Dotted link */}
                                <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                                    {[0, 1, 2].map(i => (
                                        <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(99,102,241,0.4)" }} />
                                    ))}
                                </div>

                                {/* User */}
                                <div style={{
                                    width: 28, height: 28, borderRadius: "50%",
                                    background: `${roleColor}18`,
                                    border: `2px solid ${roleColor}40`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 14, flexShrink: 0,
                                }}>{a.user?.emoji}</div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {a.asset?.name}
                                    </div>
                                    <div style={{ fontSize: 10, color: "#2e3d50" }}>→ {a.user?.name}</div>
                                </div>

                                <div style={{
                                    fontSize: 9, color: "#10b981",
                                    background: "rgba(16,185,129,0.08)",
                                    border: "1px solid rgba(16,185,129,0.2)",
                                    borderRadius: 6, padding: "2px 6px", fontWeight: 600, flexShrink: 0,
                                }}>Active ✓</div>
                            </div>
                        );
                    })}
                    {assignments.length > 2 && (
                        <div style={{ textAlign: "center", fontSize: 11, color: "#2e3d50" }}>
                            +{assignments.length - 2} more assignments
                        </div>
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
                        + Assign Asset
                    </button>
                )}

                {/* Form overlay */}
                {showForm && (
                    <div style={{
                        position: "absolute", inset: 0,
                        background: "rgba(7,9,15,0.97)",
                        borderRadius: 24, padding: 20,
                        display: "flex", flexDirection: "column", gap: 8,
                        zIndex: 10,
                        animation: "fadeIn 0.2s ease",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>New Assignment</span>
                            <button onClick={() => { setShowForm(false); setForm({ assetId: "", userId: "", date: "", notes: "" }); }} style={{
                                background: "none", border: "none", color: "#3d4d60",
                                cursor: "pointer", fontSize: 18, fontFamily: "inherit", lineHeight: 1,
                            }}>×</button>
                        </div>

                        {/* Live preview bar */}
                        <div style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: 10,
                            padding: "10px 14px",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                            minHeight: 52,
                        }}>
                            {selectedAsset ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 18 }}>{selectedAsset.type}</span>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0" }}>{selectedAsset.name}</div>
                                        <div style={{ fontSize: 10, color: "#2e3d50", fontFamily: "'JetBrains Mono', monospace" }}>{selectedAsset.code}</div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ fontSize: 22, opacity: 0.2 }}>📦</div>
                            )}

                            <LinkLine active={animLink} />

                            {selectedUser ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <div style={{
                                        width: 30, height: 30, borderRadius: "50%",
                                        background: `${ROLE_COLORS[selectedUser.role]}18`,
                                        border: `2px solid ${ROLE_COLORS[selectedUser.role]}40`,
                                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                                    }}>{selectedUser.emoji}</div>
                                    <div>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0" }}>{selectedUser.name}</div>
                                        <div style={{ fontSize: 10, color: ROLE_COLORS[selectedUser.role] }}>{selectedUser.role}</div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ fontSize: 22, opacity: 0.2 }}>👤</div>
                            )}
                        </div>

                        {/* Selects */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <div>
                                <label style={{ fontSize: 10, color: "#3d4d60", display: "block", marginBottom: 3, fontWeight: 500 }}>Asset *</label>
                                <select value={form.assetId} onChange={e => setForm(f => ({ ...f, assetId: e.target.value }))} style={{ ...selStyle, padding: "7px 10px", fontSize: 11 }}>
                                    <option value="">Select asset</option>
                                    {ASSETS.map(a => <option key={a.id} value={a.id}>{a.type} {a.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 10, color: "#3d4d60", display: "block", marginBottom: 3, fontWeight: 500 }}>User *</label>
                                <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} style={{ ...selStyle, padding: "7px 10px", fontSize: 11 }}>
                                    <option value="">Select user</option>
                                    {USERS.map(u => <option key={u.id} value={u.id}>{u.emoji} {u.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: 10, color: "#3d4d60", display: "block", marginBottom: 3, fontWeight: 500 }}>Assignment Date</label>
                            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                style={{ ...selStyle, colorScheme: "dark", padding: "7px 10px", fontSize: 11 }} />
                        </div>

                        <div>
                            <label style={{ fontSize: 10, color: "#3d4d60", display: "block", marginBottom: 3, fontWeight: 500 }}>Notes <span style={{ color: "#2e3d50" }}>(optional)</span></label>
                            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder='e.g. "For remote work setup"'
                                style={{ ...selStyle, padding: "7px 10px", fontSize: 11 }} />
                        </div>

                        <button onClick={handleAssign}
                            disabled={!form.assetId || !form.userId || assigning}
                            style={{
                                background: (form.assetId && form.userId && !assigning)
                                    ? "linear-gradient(135deg, #4f46e5, #6366f1)"
                                    : "rgba(255,255,255,0.05)",
                                border: "none", borderRadius: 10, padding: "10px",
                                color: (form.assetId && form.userId && !assigning) ? "#fff" : "#2e3d50",
                                fontWeight: 700, fontSize: 13, cursor: (form.assetId && form.userId) ? "pointer" : "not-allowed",
                                fontFamily: "inherit", marginTop: "auto",
                                transition: "all 0.2s",
                                boxShadow: (form.assetId && form.userId && !assigning) ? "0 6px 20px rgba(99,102,241,0.3)" : "none",
                            }}>
                            {assigning ? (
                                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
                                    Assigning…
                                </span>
                            ) : "Confirm Assignment →"}
                        </button>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        select:focus, input:focus {
          border-color: rgba(99,102,241,0.4) !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08) !important;
        }
        select option { background: #0e1420; color: #e2e8f0; }
      `}</style>
        </div>
    );
}
