import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Custom cursor
    const dotRef = useRef(null);
    const ringRef = useRef(null);

    useEffect(() => {
        const dot = dotRef.current;
        const ring = ringRef.current;
        if (!dot || !ring) return;
        let mx = 0, my = 0, rx = 0, ry = 0;
        const onMove = (e) => { mx = e.clientX; my = e.clientY; dot.style.left = mx + 'px'; dot.style.top = my + 'px'; };
        let animId;
        const animate = () => { rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; animId = requestAnimationFrame(animate); };
        document.addEventListener('mousemove', onMove);
        animate();
        const els = document.querySelectorAll('a,button,input,label');
        const onEnter = () => { ring.style.transform = 'translate(-50%,-50%) scale(1.6)'; ring.style.opacity = '.25'; };
        const onLeave = () => { ring.style.transform = 'translate(-50%,-50%) scale(1)'; ring.style.opacity = '.5'; };
        els.forEach(el => { el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave); });
        return () => {
            document.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(animId);
            els.forEach(el => { el.removeEventListener('mouseenter', onEnter); el.removeEventListener('mouseleave', onLeave); });
        };
    }, []);

    const validate = () => {
        const errs = {};
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Please enter a valid email address.';
        if (!password) errs.password = 'Password is required.';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!validate()) return;
        setLoading(true);
        try {
            // TODO: Replace with real admin auth API call
            // const { data } = await adminAuthService.login(email, password);
            await new Promise(r => setTimeout(r, 600)); // simulate
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const clearFieldError = (field) => {
        setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    return (
        <div className="login-page">
            <div className="cursor-ring" ref={ringRef}></div>
            <div className="cursor-dot" ref={dotRef}></div>

            <div className="login-grid">
                {/* LEFT PANEL */}
                <div className="login-left">
                    <div className="left-top">
                        <div className="login-logo">
                            <img src="/LOGOblack.png" alt="FLUXION" className="login-logo-img" />
                            FLUXION
                            <span className="admin-badge">Admin</span>
                        </div>
                    </div>

                    <div className="panel-center">
                        <div className="stats-cluster">
                            <div className="stat-card sc1"><div className="val">1,284</div><div className="lbl">Total users</div></div>
                            <div className="stat-card sc2"><div className="val rust">48</div><div className="lbl">Organizations</div></div>
                            <div className="stat-card sc3"><div className="val amber">23</div><div className="lbl">Open tickets</div></div>
                            <div className="stat-card sc4"><div className="val" style={{ color: '#4ADE80' }}>99.9%</div><div className="lbl">Uptime</div></div>

                            <div className="ring-graphic">
                                <svg viewBox="0 0 220 220" fill="none">
                                    <circle cx="110" cy="110" r="100" stroke="rgba(242,239,232,0.06)" strokeWidth="1" />
                                    <circle cx="110" cy="110" r="100" stroke="rgba(200,75,47,0.4)" strokeWidth="1.5" strokeDasharray="180 450" strokeLinecap="round">
                                        <animateTransform attributeName="transform" type="rotate" from="0 110 110" to="360 110 110" dur="12s" repeatCount="indefinite" />
                                    </circle>
                                    <circle cx="110" cy="110" r="76" stroke="rgba(242,239,232,0.04)" strokeWidth="1" />
                                    <circle cx="110" cy="110" r="76" stroke="rgba(240,165,0,0.3)" strokeWidth="1" strokeDasharray="80 400" strokeLinecap="round">
                                        <animateTransform attributeName="transform" type="rotate" from="360 110 110" to="0 110 110" dur="8s" repeatCount="indefinite" />
                                    </circle>
                                </svg>
                                <div className="ring-inner">
                                    <div className="ring-num">48</div>
                                    <div className="ring-lbl">Orgs</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="left-bottom">
                        <div className="panel-quote">
                            <div className="quote-text">"Full visibility. Total control. Manage your entire platform from one dashboard."</div>
                            <div className="quote-meta">Fluxion Admin Panel</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="login-right">
                    <div className="form-eyebrow">Admin access</div>
                    <h1 className="form-title">Admin Console.</h1>
                    <p className="form-sub">Sign in with your administrator credentials.</p>

                    {error && (
                        <div className="login-alert">
                            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="login-form" onSubmit={handleSubmit} noValidate>
                        <div className="login-field">
                            <label className="login-field-label" htmlFor="login-email">Email address</label>
                            <div className="login-field-wrap">
                                <div className="login-field-icon">
                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="2" /><path d="M1 5l7 5 7-5" /></svg>
                                </div>
                                <input
                                    type="email" id="login-email"
                                    className={fieldErrors.email ? 'input-error' : ''}
                                    placeholder="admin@fluxion.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                                    autoComplete="email"
                                />
                            </div>
                            {fieldErrors.email && (
                                <div className="login-field-error">
                                    <svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 0a6 6 0 100 12A6 6 0 006 0zm0 2a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 016 2zm0 6.5a.875.875 0 110 1.75.875.875 0 010-1.75z" /></svg>
                                    {fieldErrors.email}
                                </div>
                            )}
                        </div>

                        <div className="login-field">
                            <label className="login-field-label" htmlFor="login-password">Password</label>
                            <div className="login-field-wrap">
                                <div className="login-field-icon">
                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5 7V5a3 3 0 016 0v2" /></svg>
                                </div>
                                <input
                                    type={showPw ? 'text' : 'password'} id="login-password"
                                    className={fieldErrors.password ? 'input-error' : ''}
                                    placeholder="Your password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                                    autoComplete="current-password"
                                />
                                <button type="button" className="toggle-pw" onClick={() => setShowPw(!showPw)} aria-label="Toggle password">
                                    {showPw ? (
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                            <path d="M2 2l12 12M6.7 6.8a3 3 0 004.4 4.3M4.2 4.3C2.6 5.4 1 8 1 8s2.5 5 7 5c1.5 0 2.9-.5 4-.3M11.8 11.9C13.4 10.8 15 8 15 8s-2.5-5-7-5c-.5 0-.9 0-1.4.1" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" /><circle cx="8" cy="8" r="2" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <div className="login-field-error">
                                    <svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 0a6 6 0 100 12A6 6 0 006 0zm0 2a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 016 2zm0 6.5a.875.875 0 110 1.75.875.875 0 010-1.75z" /></svg>
                                    {fieldErrors.password}
                                </div>
                            )}
                        </div>

                        <div className="login-form-row">
                            <label className="login-checkbox-wrap">
                                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                <span>Remember me</span>
                            </label>
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? <div className="login-spinner"></div> : (
                                <>
                                    <span>Sign in to admin</span>
                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="back-link">
                        <a href="http://localhost:5173">← Back to Fluxion</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
