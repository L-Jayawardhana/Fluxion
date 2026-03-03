import { useState, useEffect, useRef } from "react";

const TARGET_DATA = [12, 19, 15, 28, 24, 38, 33, 47, 42, 58, 54, 72];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STATS = [
    { label: "Total Assets", value: 1284, suffix: "", growth: "+12.4%" },
    { label: "Active Depts", value: 8, suffix: "", growth: "+2 new" },
    { label: "Asset Value", value: 4.2, suffix: "M", growth: "+18.7%" },
];

function AnimatedNumber({ target, duration = 1800, suffix = "", decimals = 0 }) {
    const [current, setCurrent] = useState(0);
    const startTime = useRef(null);

    useEffect(() => {
        startTime.current = null;
        const animate = (ts) => {
            if (!startTime.current) startTime.current = ts;
            const progress = Math.min((ts - startTime.current) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(parseFloat((target * eased).toFixed(decimals)));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [target, duration, decimals]);

    return <span>{decimals > 0 ? current.toFixed(1) : Math.round(current)}{suffix}</span>;
}

export default function GrowingGraph() {
    const [progress, setProgress] = useState(0);
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const animRef = useRef(null);
    const startRef = useRef(null);

    const DURATION = 2200;

    const startAnimation = () => {
        setProgress(0);
        startRef.current = null;
        cancelAnimationFrame(animRef.current);

        const animate = (ts) => {
            if (!startRef.current) startRef.current = ts;
            const p = Math.min((ts - startRef.current) / DURATION, 1);
            const eased = 1 - Math.pow(1 - p, 2.5);
            setProgress(eased);
            if (p < 1) animRef.current = requestAnimationFrame(animate);
        };
        animRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        const t = setTimeout(startAnimation, 400);
        return () => { clearTimeout(t); cancelAnimationFrame(animRef.current); };
    }, []);

    const maxVal = Math.max(...TARGET_DATA);
    // Build SVG path
    const W = 600, H = 180, PAD = 20;
    const xStep = (W - PAD * 2) / (TARGET_DATA.length - 1);
    const getY = (v, prog = 1) => H - PAD - (v * prog / maxVal) * (H - PAD * 2);
    const getX = (i) => PAD + i * xStep;

    const buildPath = () => {
        const pts = TARGET_DATA.map((v, i) => {
            const localProg = Math.max(0, Math.min(1, (progress * TARGET_DATA.length - i)));
            return [getX(i), getY(v, localProg)];
        });
        if (pts.length < 2) return "";
        let d = `M ${pts[0][0]} ${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) {
            const cpX = (pts[i - 1][0] + pts[i][0]) / 2;
            d += ` C ${cpX} ${pts[i - 1][1]}, ${cpX} ${pts[i][1]}, ${pts[i][0]} ${pts[i][1]}`;
        }
        return d;
    };

    const buildFill = () => {
        const p = buildPath();
        if (!p) return "";
        const lastX = getX(TARGET_DATA.length - 1);
        const firstX = getX(0);
        return `${p} L ${lastX} ${H - PAD} L ${firstX} ${H - PAD} Z`;
    };

    const linePath = buildPath();
    const fillPath = buildFill();

    // Dot position (tip of line)
    const tipIdx = Math.min(Math.floor(progress * TARGET_DATA.length), TARGET_DATA.length - 1);
    const tipLocalProg = Math.max(0, Math.min(1, progress * TARGET_DATA.length - tipIdx));
    const tipX = getX(tipIdx);
    const tipY = getY(TARGET_DATA[tipIdx], tipLocalProg);

    return (
        <div style={{
            width: "100%",
            fontFamily: "inherit"
        }}>

            {/* Card */}
            <div style={{
                width: "100%", aspectRatio: "1",
                background: "linear-gradient(135deg, #0d1424 0%, #0a1020 100%)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 24,
                padding: 16,
                boxSizing: "border-box",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
                display: "flex", flexDirection: "column",
            }}>

                {/* Background glow */}
                <div style={{
                    position: "absolute", top: -80, right: -80,
                    width: 300, height: 300,
                    background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />
                <div style={{
                    position: "absolute", bottom: -60, left: 60,
                    width: 200, height: 200,
                    background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                        <div style={{
                            fontSize: 9, fontWeight: 600, color: "#10b981",
                            textTransform: "uppercase", letterSpacing: "0.12em",
                            display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
                        }}>
                            <span style={{
                                width: 5, height: 5, borderRadius: "50%", background: "#10b981",
                                boxShadow: "0 0 8px #10b981"
                            }} />
                            LIVE ASSET GROWTH
                        </div>
                        <h2 style={{
                            margin: 0, fontSize: 18, fontWeight: 800,
                            color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1,
                        }}>Asset Portfolio</h2>
                        <p style={{
                            margin: "4px 0 0", fontSize: 9, color: "#4f637a",
                            fontFamily: "inherit", letterSpacing: "0.05em"
                        }}>Jan - Dec 2024</p>
                    </div>
                    <button onClick={startAnimation} style={{
                        background: "rgba(16,185,129,0.1)",
                        border: "1px solid rgba(16,185,129,0.25)",
                        borderRadius: 10,
                        padding: "6px 12px",
                        color: "#10b981",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        letterSpacing: "0.04em",
                        transition: "all 0.2s",
                    }}>↺ Replay</button>
                </div>

                {/* Stat cards */}
                <div style={{
                    display: "flex", gap: 8, marginBottom: "auto", position: "relative", zIndex: 2
                }}>
                    {STATS.map((s, i) => (
                        <div key={i} style={{
                            flex: 1,
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.04)",
                            borderRadius: 12,
                            padding: "12px 10px",
                            display: "flex", flexDirection: "column",
                            justifyContent: "space-between",
                        }}>
                            <div style={{ fontSize: 9, color: "#6b7d94", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 2, margin: "6px 0 4px" }}>
                                <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                                    {s.label === "Asset Value" ? s.value : <AnimatedNumber target={s.value} />}
                                </span>
                                {s.suffix && <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7d94" }}>{s.suffix}</span>}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: "#10b981" }}>{s.growth}</div>
                        </div>
                    ))}
                </div>

                {/* SVG Graph */}
                <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
                    {/* Y-axis labels */}
                    <div style={{
                        position: "absolute", left: 0, top: 0, bottom: 30,
                        display: "flex", flexDirection: "column", justifyContent: "space-between",
                        pointerEvents: "none",
                    }}>
                        {[maxVal, Math.round(maxVal * 0.5), 0].map((v, i) => (
                            <span key={i} style={{
                                fontSize: 10, color: "#1e2d3d",
                                fontFamily: "'JetBrains Mono', monospace",
                            }}>{v}</span>
                        ))}
                    </div>

                    <svg
                        viewBox={`0 0 ${W} ${H + 24}`}
                        style={{ width: "100%", overflow: "visible", marginLeft: 20, cursor: "crosshair" }}
                        onMouseLeave={() => setHoveredIdx(null)}
                    >
                        <defs>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                            <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        </defs>

                        {/* Grid lines */}
                        {[0.25, 0.5, 0.75, 1].map((t, i) => (
                            <line key={i}
                                x1={PAD} y1={PAD + (1 - t) * (H - PAD * 2)}
                                x2={W - PAD} y2={PAD + (1 - t) * (H - PAD * 2)}
                                stroke="rgba(255,255,255,0.04)" strokeWidth="1"
                            />
                        ))}

                        {/* Fill */}
                        {fillPath && (
                            <path d={fillPath} fill="url(#fillGrad)" />
                        )}

                        {/* Line */}
                        {linePath && (
                            <path
                                d={linePath}
                                fill="none"
                                stroke="url(#lineGrad)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                filter="url(#glow)"
                            />
                        )}

                        {/* Hover targets + dots */}
                        {TARGET_DATA.map((v, i) => {
                            const localProg = Math.max(0, Math.min(1, progress * TARGET_DATA.length - i));
                            if (localProg <= 0) return null;
                            const x = getX(i), y = getY(v, localProg);
                            const isHov = hoveredIdx === i;
                            return (
                                <g key={i}>
                                    <rect
                                        x={x - 18} y={PAD} width={36} height={H - PAD}
                                        fill="transparent"
                                        onMouseEnter={() => setHoveredIdx(i)}
                                    />
                                    {isHov && (
                                        <>
                                            <line x1={x} y1={PAD} x2={x} y2={H - PAD} stroke="rgba(16,185,129,0.2)" strokeWidth="1" strokeDasharray="4 3" />
                                            <circle cx={x} cy={y} r={6} fill="#10b981" opacity={0.2} />
                                            <circle cx={x} cy={y} r={4} fill="#10b981" />
                                            {/* Tooltip */}
                                            <g transform={`translate(${Math.min(x, W - 90)}, ${y - 46})`}>
                                                <rect x={0} y={0} width={80} height={34} rx={8} fill="#10b981" />
                                                <text x={40} y={13} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={700} fontFamily="JetBrains Mono, monospace">{MONTHS[i]}</text>
                                                <text x={40} y={27} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={11} fontFamily="JetBrains Mono, monospace">{v} assets</text>
                                            </g>
                                        </>
                                    )}
                                </g>
                            );
                        })}

                        {/* Animated tip dot */}
                        {progress > 0 && progress < 1 && (
                            <g>
                                <circle cx={tipX} cy={tipY} r={10} fill="#10b981" opacity={0.15}>
                                    <animate attributeName="r" values="8;14;8" dur="1.2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.15;0.05;0.15" dur="1.2s" repeatCount="indefinite" />
                                </circle>
                                <circle cx={tipX} cy={tipY} r={4} fill="#10b981" filter="url(#glow)" />
                            </g>
                        )}

                        {/* X labels */}
                        {MONTHS.map((m, i) => {
                            const localProg = Math.max(0, Math.min(1, progress * TARGET_DATA.length - i));
                            return (
                                <text key={i}
                                    x={getX(i)} y={H + 16}
                                    textAnchor="middle"
                                    fill={localProg > 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.05)"}
                                    fontSize={10}
                                    fontFamily="JetBrains Mono, monospace"
                                    style={{ transition: "fill 0.3s" }}
                                >{m}</text>
                            );
                        })}
                    </svg>
                </div>

                {/* Bottom bar */}
                <div style={{
                    marginTop: 8,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    paddingTop: 8,
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 24, height: 2, background: "linear-gradient(90deg, #6366f1, #10b981)", borderRadius: 2 }} />
                            <span style={{ fontSize: 9, color: "#3d4d63", fontFamily: "inherit" }}>Total Assets</span>
                        </div>
                    </div>
                    <div style={{
                        fontSize: 9, color: "#3d4d63", fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 6,
                    }}>
                        <span style={{ color: "#10b981" }}>▲ 500%</span> growth this year
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #10b981; }
          50% { opacity: 0.5; box-shadow: 0 0 16px #10b981; }
        }
      `}</style>
        </div>
    );
}
