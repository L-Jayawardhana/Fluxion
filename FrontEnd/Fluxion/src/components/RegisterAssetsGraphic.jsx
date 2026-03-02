import { useState, useEffect } from "react";

const ASSET_TYPES = [
    { icon: "💻", label: "Laptop" },
    { icon: "🖨️", label: "Printer" },
    { icon: "🚗", label: "Vehicle" },
    { icon: "🪑", label: "Furniture" },
    { icon: "📱", label: "Phone" },
    { icon: "🖥️", label: "Monitor" },
];

function QRGrid({ animate }) {
    const size = 9;
    const [cells, setCells] = useState(() =>
        Array.from({ length: size * size }, () => Math.random() > 0.45)
    );

    useEffect(() => {
        if (!animate) return;
        let count = 0;
        const interval = setInterval(() => {
            setCells(Array.from({ length: size * size }, () => Math.random() > 0.45));
            count++;
            if (count > 6) clearInterval(interval);
        }, 120);
        return () => clearInterval(interval);
    }, [animate]);

    // Fixed corner markers
    const isCornerMarker = (r, c) => {
        const corners = [
            r < 3 && c < 3,
            r < 3 && c >= size - 3,
            r >= size - 3 && c < 3,
        ];
        return corners.some(Boolean);
    };

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            gap: 2,
            width: 90, height: 90,
        }}>
            {Array.from({ length: size * size }).map((_, idx) => {
                const r = Math.floor(idx / size), c = idx % size;
                const corner = isCornerMarker(r, c);
                const filled = corner || cells[idx];
                return (
                    <div key={idx} style={{
                        width: "100%", aspectRatio: "1",
                        background: filled
                            ? (corner ? "#10b981" : "rgba(255,255,255,0.85)")
                            : "transparent",
                        borderRadius: corner ? 1 : 0.5,
                        transition: animate ? "background 0.08s" : "none",
                    }} />
                );
            })}
        </div>
    );
}

export default function RegisterAssetsGraphic() {
    const [assets, setAssets] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: "", type: "", serial: "", cost: "", dept: "" });
    const [qrAnimate, setQrAnimate] = useState(false);
    const [justAdded, setJustAdded] = useState(null);

    const handleAdd = () => {
        if (!form.name.trim()) return;
        const qrCode = "AST-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const newAsset = { ...form, id: Date.now(), qrCode, status: "pending" };
        setQrAnimate(true);
        setTimeout(() => {
            setAssets(prev => [newAsset, ...prev]);
            setJustAdded(newAsset.id);
            setForm({ name: "", type: "", serial: "", cost: "", dept: "" });
            setShowForm(false);
            setQrAnimate(false);
            setTimeout(() => setJustAdded(null), 2000);
        }, 900);
    };

    const inputStyle = {
        width: "100%", boxSizing: "border-box",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 8,
        padding: "9px 12px",
        color: "#e2e8f0",
        fontSize: 13,
        fontFamily: "inherit",
        outline: "none",
    };

    return (
        <div style={{
            width: "100%",
            fontFamily: "inherit",
        }}>

            {/* Square Card */}
            <div style={{
                width: "100%",
                aspectRatio: "1",
                background: "linear-gradient(145deg, #0e1420, #0a1018)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 24,
                padding: 16,
                boxSizing: "border-box",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
                display: "flex",
                flexDirection: "column",
            }}>

                {/* Ambient glow */}
                <div style={{
                    position: "absolute", top: -60, right: -40,
                    width: 220, height: 220,
                    background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                {/* Top row: title + QR preview */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ flex: 1, paddingRight: 12 }}>
                        {/* Badge */}
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
                            margin: 0, fontSize: 15, fontWeight: 700,
                            color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2,
                        }}>Register Assets</h2>
                        <p style={{
                            margin: "4px 0 0", fontSize: 9, color: "#3d4d60", lineHeight: 1.5,
                        }}>
                            Add items your company owns.<br />Each gets a unique QR code.
                        </p>
                    </div>

                    {/* QR Code preview */}
                    <div style={{
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(16,185,129,0.2)",
                        borderRadius: 12,
                        padding: 8,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        flexShrink: 0,
                    }}>
                        <QRGrid animate={qrAnimate} />
                        <span style={{
                            fontSize: 7, color: "#10b981", fontFamily: "inherit",
                            letterSpacing: "0.06em",
                        }}>AUTO-GEN</span>
                    </div>
                </div>

                {/* Steps - compact */}
                <div style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    marginBottom: 12,
                    flex: "0 0 auto",
                }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                        {[
                            ["1", "Name, type, serial, cost"],
                            ["2", "Assign to a department"],
                            ["3", "QR auto-generated"],
                            ["4", "Label & track"],
                        ].map(([n, text]) => (
                            <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{
                                    width: 16, height: 16, borderRadius: "50%",
                                    background: "rgba(16,185,129,0.12)",
                                    border: "1px solid rgba(16,185,129,0.25)",
                                    color: "#10b981", fontSize: 8, fontWeight: 700,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>{n}</div>
                                <span style={{ fontSize: 10, color: "#4a5d70", lineHeight: 1.3 }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Asset list or empty state */}
                <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    {assets.length > 0 ? (
                        <div style={{ flex: 1, overflowY: "auto" }}>
                            {assets.slice(0, 2).map((a) => (
                                <div key={a.id} style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    background: justAdded === a.id ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
                                    border: `1px solid ${justAdded === a.id ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.05)"}`,
                                    borderRadius: 8, padding: "8px 10px", marginBottom: 4,
                                    transition: "all 0.4s",
                                }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 6,
                                        background: "rgba(16,185,129,0.1)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 14, flexShrink: 0,
                                    }}>
                                        {ASSET_TYPES.find(t => t.label === a.type)?.icon || "📦"}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                                        <div style={{ fontSize: 9, color: "#2e3d50", fontFamily: "inherit" }}>{a.qrCode}</div>
                                    </div>
                                    <div style={{
                                        fontSize: 9, color: "#10b981", background: "rgba(16,185,129,0.1)",
                                        border: "1px solid rgba(16,185,129,0.2)",
                                        borderRadius: 5, padding: "2px 6px", fontWeight: 600, flexShrink: 0,
                                    }}>QR ✓</div>
                                </div>
                            ))}
                            {assets.length > 2 && (
                                <div style={{ textAlign: "center", fontSize: 10, color: "#2e3d50", padding: "2px 0" }}>
                                    +{assets.length - 2} more assets
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Form */}
                {showForm && (
                    <div style={{
                        position: "absolute", inset: 0,
                        background: "rgba(7,9,15,0.97)",
                        borderRadius: 24,
                        padding: 20,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        zIndex: 10,
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>New Asset</span>
                            <button onClick={() => setShowForm(false)} style={{
                                background: "none", border: "none", color: "#3d4d60", cursor: "pointer",
                                fontSize: 18, fontFamily: "inherit", lineHeight: 1,
                            }}>×</button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <div>
                                <label style={{ fontSize: 9, color: "#3d4d60", display: "block", marginBottom: 3, fontWeight: 500 }}>Asset Name *</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder='e.g. "MacBook Pro"' style={{ ...inputStyle, padding: "8px 10px", fontSize: 12 }} autoFocus />
                            </div>
                            <div>
                                <label style={{ fontSize: 9, color: "#3d4d60", display: "block", marginBottom: 3, fontWeight: 500 }}>Type</label>
                                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                    style={{ ...inputStyle, cursor: "pointer", padding: "8px 10px" }}>
                                    <option value="">Select type</option>
                                    {ASSET_TYPES.map(t => <option key={t.label}>{t.icon} {t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 10, color: "#3d4d60", display: "block", marginBottom: 4, fontWeight: 500 }}>Serial No.</label>
                                <input value={form.serial} onChange={e => setForm(f => ({ ...f, serial: e.target.value }))}
                                    placeholder="SN-XXXX" style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: 10, color: "#3d4d60", display: "block", marginBottom: 4, fontWeight: 500 }}>Cost ($)</label>
                                <input value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                                    placeholder="0.00" type="number" style={inputStyle} />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 10, color: "#3d4d60", display: "block", marginBottom: 4, fontWeight: 500 }}>Department</label>
                            <select value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}
                                style={{ ...inputStyle, cursor: "pointer", padding: "8px 10px" }}>
                                <option value="">Assign department</option>
                                {["IT", "Logistics", "Finance", "Operations"].map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>

                        <button onClick={handleAdd} disabled={!form.name.trim()} style={{
                            background: form.name.trim() ? "linear-gradient(135deg, #059669, #10b981)" : "rgba(255,255,255,0.05)",
                            border: "none", borderRadius: 10, padding: "12px",
                            color: form.name.trim() ? "#fff" : "#2e3d50",
                            fontWeight: 700, fontSize: 14, cursor: form.name.trim() ? "pointer" : "not-allowed",
                            fontFamily: "inherit", marginTop: 4,
                            transition: "all 0.2s",
                        }}>
                            {qrAnimate ? "⟳ Generating QR..." : "Register Asset →"}
                        </button>
                    </div>
                )}

                {/* Bottom CTA */}
                {!showForm && (
                    <button onClick={() => setShowForm(true)} style={{
                        width: "100%",
                        background: assets.length === 0
                            ? "linear-gradient(135deg, #059669, #10b981)"
                            : "rgba(255,255,255,0.04)",
                        border: assets.length === 0
                            ? "none"
                            : "1px dashed rgba(16,185,129,0.3)",
                        borderRadius: 12, padding: "13px",
                        color: assets.length === 0 ? "#fff" : "#10b981",
                        fontWeight: 600, fontSize: 13,
                        cursor: "pointer", fontFamily: "inherit",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        marginTop: assets.length > 0 ? 8 : 0,
                        boxShadow: assets.length === 0 ? "0 8px 24px rgba(16,185,129,0.25)" : "none",
                        transition: "all 0.2s",
                    }}>
                        <span style={{ fontSize: 16 }}>+</span>
                        {assets.length === 0 ? "Register first asset" : "Register another asset"}
                    </button>
                )}
            </div>

            <style>{`
        select option { background: #0e1420; color: #e2e8f0; }
        input:focus, select:focus { border-color: rgba(16,185,129,0.4) !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.08) !important; }
      `}</style>
        </div>
    );
}
