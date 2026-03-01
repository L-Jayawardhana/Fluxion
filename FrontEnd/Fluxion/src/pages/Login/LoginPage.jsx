import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, GOOGLE_CLIENT_ID } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import './LoginPage.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const dotRef = useRef(null);
    const ringRef = useRef(null);
    const googleBtnRef = useRef(null);

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
            const { data } = await authService.login(email, password);
            login(data.token, { userId: data.userId, fullName: data.fullName, email: data.email, role: data.role });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const clearFieldError = (field) => {
        setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    // Google Sign-In
    const handleGoogleLogin = useCallback(async (response) => {
        setError('');
        if (!response?.credential) {
            setError('Google did not return a credential token. Please try again.');
            return;
        }
        setLoading(true);
        try {
            const { data } = await authService.googleLogin(response.credential);

            if (data.isNewUser) {
                // User is not registered. Redirect to register page with state to jump to org setup.
                navigate('/register', { state: { googleData: data } });
                return;
            }

            login(data.token, { userId: data.userId, fullName: data.fullName, email: data.email, role: data.role });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [login, navigate]);

    useEffect(() => {
        if (window.google && googleBtnRef.current) {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleLogin,
            });
            window.google.accounts.id.renderButton(
                googleBtnRef.current,
                {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'rectangular',
                    width: 376,
                }
            );
        }
    }, [handleGoogleLogin]);

    return (
        <div className="login-page">
            <div className="cursor-ring" ref={ringRef}></div>
            <div className="cursor-dot" ref={dotRef}></div>

            <div className="login-grid">
                {/* LEFT PANEL */}
                <div className="login-left">
                    <div className="left-top">
                        <Link to="/" className="login-logo">
                            <img src="/LOGOblack.png" alt="FLUXION" className="login-logo-img" />
                            FLUXION
                        </Link>
                    </div>

                    <div className="panel-center">
                        <div className="stats-cluster">
                            <div className="stat-card sc1"><div className="val">248</div><div className="lbl">Assets tracked</div></div>
                            <div className="stat-card sc2"><div className="val rust">12</div><div className="lbl">Open tickets</div></div>
                            <div className="stat-card sc3"><div className="val amber">3</div><div className="lbl">In maintenance</div></div>
                            <div className="stat-card sc4"><div className="val" style={{ color: '#4ADE80' }}>94%</div><div className="lbl">Uptime</div></div>

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
                                    <div className="ring-num">11</div>
                                    <div className="ring-lbl">Entities</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="left-bottom">
                        <div className="panel-quote">
                            <div className="quote-text">"Know what your company owns, where it is, and who's responsible."</div>
                            <div className="quote-meta">Enterprise Asset Management</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="login-right">
                    <div className="form-eyebrow">Secure sign in</div>
                    <h1 className="form-title">Welcome back.</h1>
                    <p className="form-sub">Sign in to your organisation workspace.</p>

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
                                    placeholder="you@company.com"
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
                                <input type="checkbox" />
                                <span>Remember me for 7 days</span>
                            </label>
                            <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? <div className="login-spinner"></div> : (
                                <>
                                    <span>Sign in to workspace</span>
                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-divider">or</div>

                    <div className="google-btn-outer">
                        <div className="google-btn-visual">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 001 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>Continue with Google</span>
                        </div>
                        <div className="google-btn-real" ref={googleBtnRef}></div>
                    </div>
                    <div className="register-link">
                        Don't have an account? <Link to="/register">Create your organisation →</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
