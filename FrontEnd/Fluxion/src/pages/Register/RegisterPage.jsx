import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import './RegisterPage.css';

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', orgName: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [plan, setPlan] = useState('free');
    const [billing, setBilling] = useState('monthly');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const dotRef = useRef(null);
    const ringRef = useRef(null);

    // Custom cursor
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
        const els = document.querySelectorAll('a,button,input,label,select');
        const onEnter = () => { ring.style.transform = 'translate(-50%,-50%) scale(1.6)'; ring.style.opacity = '.25'; };
        const onLeave = () => { ring.style.transform = 'translate(-50%,-50%) scale(1)'; ring.style.opacity = '.5'; };
        els.forEach(el => { el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave); });
        return () => {
            document.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(animId);
            els.forEach(el => { el.removeEventListener('mouseenter', onEnter); el.removeEventListener('mouseleave', onLeave); });
        };
    }, [step]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    };

    const slug = form.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Password strength
    const getStrength = (pw) => {
        if (!pw) return { score: 0, label: '', color: '' };
        let score = 0;
        if (pw.length >= 8) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
        const colors = ['', 'var(--error)', 'var(--accent)', 'var(--accent)', 'var(--green)'];
        const classes = ['', 'weak', 'medium', 'medium', 'strong'];
        return { score, label: labels[score], color: colors[score], cls: classes[score] };
    };
    const strength = getStrength(form.password);

    const validateStep1 = () => {
        const errs = {};
        if (!form.firstName.trim()) errs.firstName = 'Required';
        if (!form.lastName.trim()) errs.lastName = 'Required';
        if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
        if (!form.orgName.trim()) errs.orgName = 'Required';
        if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext1 = () => {
        if (!validateStep1()) return;
        setLoading(true);
        setTimeout(() => { setLoading(false); setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 600);
    };

    const handleSubmit = async () => {
        if (!termsAccepted) { alert('Please accept the Terms of Service to continue.'); return; }
        setLoading(true);
        try {
            await authService.register(`${form.firstName} ${form.lastName}`, form.email, form.password);
            setStep(3);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.join(', ') || 'Registration failed. Please try again.';
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const ErrorIcon = () => (
        <svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 0a6 6 0 100 12A6 6 0 006 0zm0 2a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 016 2zm0 6.5a.875.875 0 110 1.75.875.875 0 010-1.75z" /></svg>
    );

    const ArrowIcon = () => (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
    );

    return (
        <div className="register-page">
            <div className="cursor-ring" ref={ringRef}></div>
            <div className="cursor-dot" ref={dotRef}></div>

            {/* NAV */}
            <nav className="reg-nav">
                <Link to="/" className="reg-logo">
                    <img src="/LOGOblack.png" alt="FLUXION" className="reg-logo-img" />
                    FLUXION
                </Link>
                <div className="reg-nav-right">Already have an account? <Link to="/login">Sign in →</Link></div>
            </nav>

            {/* STEPPER */}
            <div className="stepper-wrap">
                <div className="stepper">
                    <div className={`step-item ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}>
                        <div className={`step-circle ${step > 1 ? 'done' : step === 1 ? 'active' : ''}`}>
                            {step > 1 ? '✓' : <span>1</span>}
                        </div>
                        <div className="step-label">Your details</div>
                    </div>
                    <div className={`step-line ${step > 1 ? 'done' : ''}`}></div>
                    <div className={`step-item ${step >= 2 ? (step > 2 ? 'done' : 'active') : ''}`}>
                        <div className={`step-circle ${step > 2 ? 'done' : step === 2 ? 'active' : ''}`}>
                            {step > 2 ? '✓' : <span>2</span>}
                        </div>
                        <div className="step-label">Choose plan</div>
                    </div>
                    <div className={`step-line ${step > 2 ? 'done' : ''}`}></div>
                    <div className={`step-item ${step === 3 ? 'done' : ''}`}>
                        <div className={`step-circle ${step === 3 ? 'done' : ''}`}>
                            {step === 3 ? '✓' : <span>3</span>}
                        </div>
                        <div className="step-label">All set</div>
                    </div>
                </div>
            </div>

            {/* MAIN */}
            <div className="reg-main">
                {/* STEP 1 */}
                {step === 1 && (
                    <div className="reg-step-panel" key="step1">
                        <h1 className="panel-title">Create your <em>organisation.</em></h1>
                        <p className="panel-sub">Set up your workspace. You'll be the Owner — you can invite Admins, Technicians, and Users after setup.</p>

                        <div className="reg-field-grid">
                            <div className="reg-field">
                                <label className="reg-field-label">First name</label>
                                <div className="reg-field-wrap">
                                    <div className="reg-field-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="3" /><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg></div>
                                    <input type="text" name="firstName" className={fieldErrors.firstName ? 'input-error' : ''} value={form.firstName} onChange={handleChange} placeholder="Jane" />
                                </div>
                                {fieldErrors.firstName && <div className="reg-field-error"><ErrorIcon />{fieldErrors.firstName}</div>}
                            </div>
                            <div className="reg-field">
                                <label className="reg-field-label">Last name</label>
                                <div className="reg-field-wrap">
                                    <div className="reg-field-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="3" /><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg></div>
                                    <input type="text" name="lastName" className={fieldErrors.lastName ? 'input-error' : ''} value={form.lastName} onChange={handleChange} placeholder="Smith" />
                                </div>
                                {fieldErrors.lastName && <div className="reg-field-error"><ErrorIcon />{fieldErrors.lastName}</div>}
                            </div>
                        </div>

                        <div className="reg-field">
                            <label className="reg-field-label">Work email</label>
                            <div className="reg-field-wrap">
                                <div className="reg-field-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="2" /><path d="M1 5l7 5 7-5" /></svg></div>
                                <input type="email" name="email" className={fieldErrors.email ? 'input-error' : ''} value={form.email} onChange={handleChange} placeholder="jane@company.com" />
                            </div>
                            {fieldErrors.email && <div className="reg-field-error"><ErrorIcon />{fieldErrors.email}</div>}
                        </div>

                        <div className="reg-field">
                            <label className="reg-field-label">Organisation name</label>
                            <div className="reg-field-wrap">
                                <div className="reg-field-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="12" height="8" rx="1" /><path d="M5 6V4a3 3 0 016 0v2" /></svg></div>
                                <input type="text" name="orgName" className={fieldErrors.orgName ? 'input-error' : ''} value={form.orgName} onChange={handleChange} placeholder="Acme Corporation" />
                            </div>
                            {fieldErrors.orgName && <div className="reg-field-error"><ErrorIcon />{fieldErrors.orgName}</div>}
                            {slug && (
                                <div className="slug-preview">
                                    <span className="slug-prefix">fluxion.io/</span>
                                    <span className="slug-value">{slug}</span>
                                </div>
                            )}
                        </div>

                        <div className="reg-field">
                            <label className="reg-field-label">Password</label>
                            <div className="reg-field-wrap">
                                <div className="reg-field-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5 7V5a3 3 0 016 0v2" /></svg></div>
                                <input type={showPw ? 'text' : 'password'} name="password" className={fieldErrors.password ? 'input-error' : ''} value={form.password} onChange={handleChange} placeholder="Min. 8 characters" />
                                <button type="button" className="reg-toggle-pw" onClick={() => setShowPw(!showPw)}>
                                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" /><circle cx="8" cy="8" r="2" />
                                    </svg>
                                </button>
                            </div>
                            {fieldErrors.password && <div className="reg-field-error"><ErrorIcon />{fieldErrors.password}</div>}
                            {form.password && (
                                <div className="pw-strength">
                                    <div className="pw-bars">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className={`pw-bar ${i <= strength.score ? strength.cls : ''}`}></div>
                                        ))}
                                    </div>
                                    <div className="pw-label" style={{ color: strength.color }}>{strength.label}</div>
                                </div>
                            )}
                        </div>

                        <button className="btn-next" onClick={handleNext1} disabled={loading}>
                            {loading ? <div className="reg-spinner"></div> : <><span>Continue to plan selection</span><ArrowIcon /></>}
                        </button>

                        <div className="reg-divider">or</div>
                        <div className="reg-login-link">Already have an account? <Link to="/login">Sign in</Link></div>
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div className="reg-step-panel" key="step2">
                        <h1 className="panel-title">Choose a <em>plan.</em></h1>
                        <p className="panel-sub">Start free — no credit card required. Upgrade anytime as your team grows.</p>

                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                            <div className="billing-toggle">
                                <button className={`billing-btn ${billing === 'monthly' ? 'active' : ''}`} onClick={() => setBilling('monthly')}>Monthly</button>
                                <button className={`billing-btn ${billing === 'annual' ? 'active' : ''}`} onClick={() => setBilling('annual')}>Annual</button>
                            </div>
                            {billing === 'annual' && (
                                <span className="billing-save">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.5 4.5H12l-3.7 2.7 1.4 4.3L6 9 2.3 11.5l1.4-4.3L0 4.5h4.5z" /></svg>
                                    Save 20%
                                </span>
                            )}
                        </div>

                        <div className="plan-cards">
                            <div className={`plan-card ${plan === 'free' ? 'selected' : ''}`} onClick={() => setPlan('free')}>
                                <div className="plan-card-name">Free</div>
                                <div className="plan-card-price">$0 <span>/ mo</span></div>
                                <div className="plan-card-feature">5 users</div>
                                <div className="plan-card-feature">50 assets</div>
                                <div className="plan-card-feature">Basic dashboard</div>
                            </div>
                            <div className={`plan-card ${plan === 'pro' ? 'selected' : ''}`} onClick={() => setPlan('pro')}>
                                <div className="plan-popular">Popular</div>
                                <div className="plan-card-name">Pro</div>
                                <div className="plan-card-price">
                                    {billing === 'annual' ? '$23' : '$29'} <span>{billing === 'annual' ? '/ mo, billed annually' : '/ mo'}</span>
                                </div>
                                <div className="plan-card-feature">25 users</div>
                                <div className="plan-card-feature">500 assets</div>
                                <div className="plan-card-feature">QR + PDF export</div>
                            </div>
                            <div className={`plan-card ${plan === 'enterprise' ? 'selected' : ''}`} onClick={() => setPlan('enterprise')}>
                                <div className="plan-card-name">Enterprise</div>
                                <div className="plan-card-price">Custom</div>
                                <div className="plan-card-feature">Unlimited users</div>
                                <div className="plan-card-feature">Unlimited assets</div>
                                <div className="plan-card-feature">SLA reports</div>
                            </div>
                        </div>

                        <div className="terms-wrap">
                            <input type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                            <label htmlFor="terms">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>. I understand that FLUXION will process my organisation's data in accordance with its privacy policy.</label>
                        </div>

                        <button className="btn-next" onClick={handleSubmit} disabled={loading}>
                            {loading ? <div className="reg-spinner"></div> : <><span>Create organisation</span><ArrowIcon /></>}
                        </button>
                        <button className="btn-back" onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 8H3M7 4L3 8l4 4" /></svg>
                            Back
                        </button>
                    </div>
                )}

                {/* STEP 3 — Success */}
                {step === 3 && (
                    <div className="reg-step-panel" key="step3">
                        <div className="success-panel">
                            <div className="success-icon">
                                <svg viewBox="0 0 32 32"><polyline points="6 16 13 23 26 9" /></svg>
                            </div>
                            <h2 className="success-title">You're all set, <em>{form.firstName}</em>.</h2>
                            <p className="success-sub">Your organisation workspace is ready. Sign in to start registering assets, adding your team, and managing maintenance.</p>

                            <div className="success-details">
                                <div className="detail-row">
                                    <span className="detail-key">Organisation</span>
                                    <span className="detail-val">{form.orgName}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-key">Workspace</span>
                                    <span className="detail-val">fluxion.io/{slug}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-key">Plan</span>
                                    <span className="detail-val">{plan.charAt(0).toUpperCase() + plan.slice(1)}{billing === 'annual' ? ' (Annual)' : ''}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-key">Your role</span>
                                    <span className="detail-val">Owner</span>
                                </div>
                            </div>

                            <Link to="/login" className="btn-go">
                                Go to your workspace
                                <ArrowIcon />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
