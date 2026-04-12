import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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
    // Email verification
    const [emailVerified, setEmailVerified] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [codeError, setCodeError] = useState('');
    const [codeSending, setCodeSending] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const dotRef = useRef(null);
    const ringRef = useRef(null);
    const fileInputRef = useRef(null);
    const googleBtnRef = useRef(null);
    const gsiInitializedRef = useRef(false);

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

    // Handle Google login data passed from LoginPage navigation state
    useEffect(() => {
        if (location.state?.googleData && step === 1) {
            const data = location.state.googleData;
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

            // Clear the state so it doesn't trigger again on refresh
            navigate('/register', { replace: true, state: {} });
        }
    }, [location.state, navigate, step]);

    // Google Sign-In
    const handleGoogleSignUp = useCallback(async (response) => {
        setApiError('');
        if (!response?.credential) {
            setApiError('Google did not return a credential token. Please try again.');
            return;
        }
        setLoading(true);
        try {
            const { data } = await authService.googleLogin(response.credential);

            if (!data.isNewUser) {
                // User already exists. Log them in and redirect to welcome.
                login(data.token, { userId: data.userId, fullName: data.fullName, email: data.email, role: data.role });
                navigate('/welcome');
                return;
            }

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
    }, [login, navigate]);

    useEffect(() => {
        if (window.google && step === 1 && googleBtnRef.current) {
            if (!gsiInitializedRef.current) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleSignUp,
                });
                gsiInitializedRef.current = true;
            }
            googleBtnRef.current.innerHTML = '';
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
        // Reset email verification when email changes
        if (name === 'email') {
            setEmailVerified(false);
            setCodeSent(false);
            setVerificationCode('');
            setCodeError('');
        }
    };

    // Email verification handlers
    const handleSendCode = async () => {
        if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setFieldErrors(prev => ({ ...prev, email: 'Enter a valid email first.' }));
            return;
        }
        setCodeSending(true);
        setCodeError('');
        try {
            await authService.sendVerificationCode(form.email);
            setCodeSent(true);
        } catch (err) {
            setCodeError(err.response?.data?.message || 'Failed to send code. Try again.');
        } finally {
            setCodeSending(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            setCodeError('Enter the 6-digit code.');
            return;
        }
        setVerifying(true);
        setCodeError('');
        try {
            const { data } = await authService.verifyCode(form.email, verificationCode);
            if (data.isValid) {
                setEmailVerified(true);
                setCodeError('');
            } else {
                setCodeError(data.message || 'Invalid code.');
            }
        } catch (err) {
            setCodeError(err.response?.data?.message || 'Invalid or expired code.');
        } finally {
            setVerifying(false);
        }
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
        if (!emailVerified) errs.email = errs.email || 'Please verify your email first.';
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

        // Send welcome email (fire-and-forget — don't block UI)
        try {
            const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1) + (billing === 'annual' ? ' (Annual)' : '');
            authService.sendWelcomeEmail(
                form.email,
                form.firstName,
                createdOrg?.orgName || form.orgName || 'My Organisation',
                createdOrg?.slug || slug || 'workspace',
                planLabel
            ).catch(() => { }); // silently ignore email errors
        } catch (e) {
            // welcome email is non-critical, ignore errors
            void e;
        }

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
            const reader = new FileReader();
            reader.onload = (evt) => {
                const base64 = evt.target.result;
                setLogoFile({ name: file.name, base64: base64 });
                setLogoPreview(base64);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleLogoSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const base64 = evt.target.result;
                setLogoFile({ name: file.name, base64: base64 });
                setLogoPreview(base64);
            };
            reader.readAsDataURL(file);
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
                            <div className="reg-field-wrap email-verify-wrap">
                                <div className="reg-field-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="2" /><path d="M1 5l7 5 7-5" /></svg></div>
                                <input type="email" name="email" className={fieldErrors.email ? 'input-error' : emailVerified ? 'input-verified' : ''} value={form.email} onChange={handleChange} placeholder="jane@company.com" disabled={emailVerified} />
                                {!emailVerified && (
                                    <button type="button" className="btn-verify-email" onClick={handleSendCode} disabled={codeSending || !form.email}>
                                        {codeSending ? <div className="reg-spinner-sm"></div> : codeSent ? 'Resend' : 'Verify'}
                                    </button>
                                )}
                                {emailVerified && (
                                    <div className="verified-badge">
                                        <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.5 5.3a.75.75 0 00-1.06-1.06L7 7.69 5.56 6.25a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l4-4z" /></svg>
                                        Verified
                                    </div>
                                )}
                            </div>
                            {fieldErrors.email && <div className="reg-field-error"><ErrorIcon />{fieldErrors.email}</div>}

                            {/* Code input — appears after sending */}
                            {codeSent && !emailVerified && (
                                <div className="verify-code-section">
                                    <p className="verify-code-hint">We sent a 6-digit code to <strong>{form.email}</strong></p>
                                    <div className="verify-code-row">
                                        <input
                                            type="text"
                                            className={`verify-code-input ${codeError ? 'input-error' : ''}`}
                                            value={verificationCode}
                                            onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setCodeError(''); }}
                                            placeholder="000000"
                                            maxLength={6}
                                            autoFocus
                                        />
                                        <button type="button" className="btn-verify-code" onClick={handleVerifyCode} disabled={verifying || verificationCode.length !== 6}>
                                            {verifying ? <div className="reg-spinner-sm"></div> : 'Confirm'}
                                        </button>
                                    </div>
                                    {codeError && <div className="reg-field-error"><ErrorIcon />{codeError}</div>}
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
                            {loading ? <div className="reg-spinner"></div> : <><span>Continue</span><ArrowIcon /></>}
                        </button>

                        <div className="reg-divider">or</div>

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
