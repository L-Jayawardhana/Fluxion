import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, GOOGLE_CLIENT_ID } from '../../services/authService';
import './RegisterPage.css';

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', orgName: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [plan, setPlan] = useState('free');
    const [billing, setBilling] = useState('monthly');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [registeredUser, setRegisteredUser] = useState(null); // { userId, token }
    const [orgTimezone, setOrgTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [createdOrg, setCreatedOrg] = useState(null);
    const navigate = useNavigate();

    const dotRef = useRef(null);
    const ringRef = useRef(null);
    const fileInputRef = useRef(null);
    const googleBtnRef = useRef(null);

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

    // Google Sign-In
    const handleGoogleSignUp = useCallback(async (response) => {
        setApiError('');
        setLoading(true);
        try {
            const { data } = await authService.googleLogin(response.credential);
            localStorage.setItem('token', data.token);
            setRegisteredUser({ userId: data.userId, token: data.token });
            // Pre-fill name from Google
            const nameParts = data.fullName?.split(' ') || ['', ''];
            setForm(prev => ({
                ...prev,
                firstName: nameParts[0] || prev.firstName,
                lastName: nameParts.slice(1).join(' ') || prev.lastName,
                email: data.email || prev.email,
            }));
            // Skip to org setup (step 2)
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            setApiError(err.response?.data?.message || 'Google sign-up failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (window.google && step === 1 && googleBtnRef.current) {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleSignUp,
            });
            window.google.accounts.id.renderButton(
                googleBtnRef.current,
                {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'rectangular',
                    width: 420,
                }
            );
        }
    }, [handleGoogleSignUp, step]);

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
        if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Step 1: Register user
    const handleNext1 = async () => {
        if (!validateStep1()) return;
        setApiError('');
        setLoading(true);
        try {
            const fullName = `${form.firstName} ${form.lastName}`;
            const res = await authService.register(fullName, form.email, form.password);
            const data = res.data;
            setRegisteredUser({ userId: data.userId, token: data.token });
            // Store token so subsequent API calls (org creation) are authenticated
            localStorage.setItem('token', data.token);
            setStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            const data = err.response?.data;
            let msg = 'Registration failed. Please try again.';
            if (typeof data === 'string') msg = data;
            else if (data?.message) msg = data.message;
            else if (data?.errors) {
                if (Array.isArray(data.errors)) msg = data.errors.join(', ');
                else if (typeof data.errors === 'object') msg = Object.values(data.errors).flat().join(', ');
            } else if (data?.title) msg = data.title;
            setApiError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Create org
    const handleOrgSubmit = async () => {
        const errs = {};
        if (!form.orgName.trim()) errs.orgName = 'Required';
        if (!slug) errs.orgName = 'Organisation name is required.';
        setFieldErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setApiError('');
        setLoading(true);
        try {
            const res = await authService.createOrganization(form.orgName, slug, orgTimezone, registeredUser.userId);
            const orgData = res.data;
            setCreatedOrg(orgData);

            // Upload logo if provided
            if (logoFile) {
                try {
                    await authService.uploadOrgLogo(orgData.orgId, logoFile);
                } catch {
                    // Logo upload is non-critical, continue
                }
            }

            setStep(3);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            const data = err.response?.data;
            let msg = 'Failed to create organisation. Please try again.';
            if (typeof data === 'string') msg = data;
            else if (data?.message) msg = data.message;
            else if (data?.errors) {
                if (Array.isArray(data.errors)) msg = data.errors.join(', ');
                else if (typeof data.errors === 'object') msg = Object.values(data.errors).flat().join(', ');
            }
            setApiError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Skip org setup
    const handleSkipOrg = () => {
        setStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Step 3: Finalize (plan selection)
    const handleSubmit = async () => {
        if (!termsAccepted) { setApiError('Please accept the Terms of Service to continue.'); return; }
        setApiError('');
        // Plan selection is frontend-only for now — just proceed to success
        setStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Logo drag & drop
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    }, []);

    const handleLogoSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const ErrorIcon = () => (
        <svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 0a6 6 0 100 12A6 6 0 006 0zm0 2a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 016 2zm0 6.5a.875.875 0 110 1.75.875.875 0 010-1.75z" /></svg>
    );

    const ArrowIcon = () => (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
    );

    const stepLabels = ['Your details', 'Organisation', 'Choose plan', 'All set'];

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
                    {stepLabels.map((label, i) => {
                        const num = i + 1;
                        const isDone = step > num;
                        const isActive = step === num;
                        return (
                            <span key={num} style={{ display: 'contents' }}>
                                {i > 0 && <div className={`step-line ${isDone ? 'done' : ''}`}></div>}
                                <div className={`step-item ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                                    <div className={`step-circle ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                                        {isDone ? '✓' : <span>{num}</span>}
                                    </div>
                                    <div className="step-label">{label}</div>
                                </div>
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* MAIN */}
            <div className="reg-main">
                {/* STEP 1 — Details */}
                {step === 1 && (
                    <div className="reg-step-panel" key="step1">
                        <h1 className="panel-title">Create your <em>account.</em></h1>
                        <p className="panel-sub">Set up your workspace. You'll be the Owner — you can invite Admins, Technicians, and Users after setup.</p>

                        {apiError && (
                            <div className="reg-api-error">
                                <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 7a.875.875 0 110-1.75.875.875 0 010 1.75z" /></svg>
                                <span>{apiError}</span>
                                <button type="button" onClick={() => setApiError('')} className="reg-api-error-close">×</button>
                            </div>
                        )}

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
                            {loading ? <div className="reg-spinner"></div> : <><span>Continue</span><ArrowIcon /></>}
                        </button>

                        <div className="reg-divider">or</div>

                        <div className="google-btn-wrap" ref={googleBtnRef}></div>

                        <div className="reg-login-link">Already have an account? <Link to="/login">Sign in</Link></div>
                    </div>
                )}

                {/* STEP 2 — Organisation Setup */}
                {step === 2 && (
                    <div className="reg-step-panel" key="step2">
                        <h1 className="panel-title">Set up your <em>organisation.</em></h1>
                        <p className="panel-sub">Create your workspace. You can always update these details later from Settings.</p>

                        {apiError && (
                            <div className="reg-api-error">
                                <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 7a.875.875 0 110-1.75.875.875 0 010 1.75z" /></svg>
                                <span>{apiError}</span>
                                <button type="button" onClick={() => setApiError('')} className="reg-api-error-close">×</button>
                            </div>
                        )}

                        {/* Logo Drop Zone */}
                        <div className="reg-field">
                            <label className="reg-field-label">Organisation logo</label>
                            <div
                                className={`logo-dropzone ${dragActive ? 'drag-active' : ''} ${logoPreview ? 'has-logo' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {logoPreview ? (
                                    <div className="logo-preview-wrap">
                                        <img src={logoPreview} alt="Logo preview" className="logo-preview-img" />
                                        <button type="button" className="logo-remove-btn" onClick={(e) => { e.stopPropagation(); removeLogo(); }}>
                                            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.6 3.5L3.5 4.6 6.9 8l-3.4 3.4 1.1 1.1L8 9.1l3.4 3.4 1.1-1.1L9.1 8l3.4-3.4-1.1-1.1L8 6.9z" /></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="logo-drop-content">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="logo-drop-icon">
                                            <path d="M12 16V8m0 0l-3 3m3-3l3 3" />
                                            <path d="M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2 2 6.477 2 12z" />
                                        </svg>
                                        <div className="logo-drop-text"><span>Drop your logo here</span> or click to browse</div>
                                        <div className="logo-drop-hint">PNG, JPG, SVG or WebP · Max 2 MB</div>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleLogoSelect} style={{ display: 'none' }} />
                            </div>
                        </div>

                        <div className="reg-field">
                            <label className="reg-field-label">Organisation name</label>
                            <div className="reg-field-wrap">
                                <div className="reg-field-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="12" height="10" rx="1" /><path d="M5 4V2h6v2" /><line x1="2" y1="8" x2="14" y2="8" /></svg></div>
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
                            <label className="reg-field-label">Timezone</label>
                            <div className="reg-field-wrap">
                                <div className="reg-field-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><path d="M8 4v4l3 2" /></svg></div>
                                <select className="reg-select" value={orgTimezone} onChange={(e) => setOrgTimezone(e.target.value)}>
                                    <option value="">Select timezone...</option>
                                    {Intl.supportedValuesOf?.('timeZone')?.map(tz => (
                                        <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                                    )) || (
                                            <>
                                                <option value="UTC">UTC</option>
                                                <option value="America/New_York">America/New York</option>
                                                <option value="Europe/London">Europe/London</option>
                                                <option value="Asia/Colombo">Asia/Colombo</option>
                                                <option value="Asia/Tokyo">Asia/Tokyo</option>
                                            </>
                                        )}
                                </select>
                            </div>
                        </div>

                        <button className="btn-next" onClick={handleOrgSubmit} disabled={loading}>
                            {loading ? <div className="reg-spinner"></div> : <><span>Create organisation</span><ArrowIcon /></>}
                        </button>
                        <button className="btn-skip" onClick={handleSkipOrg}>
                            Skip — I'll set this up later
                        </button>
                    </div>
                )}

                {/* STEP 3 — Plan */}
                {step === 3 && (
                    <div className="reg-step-panel" key="step3">
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

                        {apiError && (
                            <div className="reg-api-error">
                                <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 7a.875.875 0 110-1.75.875.875 0 010 1.75z" /></svg>
                                <span>{apiError}</span>
                                <button type="button" onClick={() => setApiError('')} className="reg-api-error-close">×</button>
                            </div>
                        )}

                        <button className="btn-next" onClick={handleSubmit} disabled={loading}>
                            {loading ? <div className="reg-spinner"></div> : <><span>Complete setup</span><ArrowIcon /></>}
                        </button>
                        <button className="btn-back" onClick={() => { setStep(2); setApiError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 8H3M7 4L3 8l4 4" /></svg>
                            Back
                        </button>
                    </div>
                )}

                {/* STEP 4 — Success */}
                {step === 4 && (
                    <div className="reg-step-panel" key="step4">
                        <div className="success-panel">
                            <div className="success-icon">
                                <svg viewBox="0 0 32 32"><polyline points="6 16 13 23 26 9" /></svg>
                            </div>
                            <h2 className="success-title">You're all set, <em>{form.firstName}</em>.</h2>
                            <p className="success-sub">Your workspace is ready. Sign in to start registering assets, adding your team, and managing maintenance.</p>

                            <div className="success-details">
                                {createdOrg && (
                                    <>
                                        <div className="detail-row">
                                            <span className="detail-key">Organisation</span>
                                            <span className="detail-val">{createdOrg.orgName}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-key">Workspace</span>
                                            <span className="detail-val">fluxion.io/{createdOrg.slug}</span>
                                        </div>
                                    </>
                                )}
                                <div className="detail-row">
                                    <span className="detail-key">Plan</span>
                                    <span className="detail-val">{plan.charAt(0).toUpperCase() + plan.slice(1)}{billing === 'annual' ? ' (Annual)' : ''}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-key">Your role</span>
                                    <span className="detail-val">{createdOrg ? 'Owner' : 'User'}</span>
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
