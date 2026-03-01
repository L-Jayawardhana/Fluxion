import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(1); // 1=email, 2=code, 3=new password
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
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
        const els = document.querySelectorAll('a,button,input,label');
        const onEnter = () => { ring.style.transform = 'translate(-50%,-50%) scale(1.6)'; ring.style.opacity = '.25'; };
        const onLeave = () => { ring.style.transform = 'translate(-50%,-50%) scale(1)'; ring.style.opacity = '.5'; };
        els.forEach(el => { el.addEventListener('mouseenter', onEnter); el.addEventListener('mouseleave', onLeave); });
        return () => {
            document.removeEventListener('mousemove', onMove);
            cancelAnimationFrame(animId);
            els.forEach(el => { el.removeEventListener('mouseenter', onEnter); el.removeEventListener('mouseleave', onLeave); });
        };
    }, [step]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const clearFieldError = (field) => {
        setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    // Step 1: Send code
    const handleSendCode = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const errs = {};
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Please enter a valid email address.';
        if (Object.keys(errs).length) { setFieldErrors(errs); return; }

        setLoading(true);
        try {
            await authService.forgotPassword(email);
            setSuccess('Verification code sent! Check your inbox.');
            setStep(2);
            setResendCooldown(60);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Resend code
    const handleResendCode = async () => {
        if (resendCooldown > 0) return;
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await authService.forgotPassword(email);
            setSuccess('A new code has been sent to your email.');
            setResendCooldown(60);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify code
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const errs = {};
        if (!code || code.length < 4) errs.code = 'Please enter the verification code.';
        if (Object.keys(errs).length) { setFieldErrors(errs); return; }

        setStep(3);
    };

    // Step 3: Reset password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const errs = {};
        if (!newPassword || newPassword.length < 6) errs.newPassword = 'Password must be at least 6 characters.';
        if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
        if (Object.keys(errs).length) { setFieldErrors(errs); return; }

        setLoading(true);
        try {
            const { data } = await authService.resetPassword(email, code, newPassword);
            if (data.success) {
                setSuccess('Password reset successfully! Redirecting to login...');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(data.message || 'Failed to reset password.');
                if (data.message?.toLowerCase().includes('code')) {
                    setStep(2);
                    setCode('');
                }
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to reset password. Please try again.';
            setError(msg);
            if (msg.toLowerCase().includes('code')) {
                setStep(2);
                setCode('');
            }
        } finally {
            setLoading(false);
        }
    };

    const stepTitles = {
        1: { eyebrow: 'Account recovery', title: 'Forgot password?', sub: 'Enter your email address and we\'ll send you a verification code.' },
        2: { eyebrow: 'Verification', title: 'Check your inbox.', sub: `We sent a 6-digit code to ${email}` },
        3: { eyebrow: 'New password', title: 'Set new password.', sub: 'Choose a strong password for your account.' },
    };

    const currentStep = stepTitles[step];

    return (
        <div className="forgot-page">
            <div className="cursor-ring" ref={ringRef}></div>
            <div className="cursor-dot" ref={dotRef}></div>

            <div className="forgot-grid">
                {/* LEFT PANEL */}
                <div className="forgot-left">
                    <div className="left-top">
                        <Link to="/" className="forgot-logo">
                            <img src="/LOGOblack.png" alt="FLUXION" className="forgot-logo-img" />
                            FLUXION
                        </Link>
                    </div>

                    <div className="panel-center">
                        <div className="lock-graphic">
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
                            <div className="lock-inner">
                                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(242,239,232,0.7)" strokeWidth="1.5" width="48" height="48">
                                    <rect x="5" y="11" width="14" height="10" rx="2" />
                                    <path d="M8 11V7a4 4 0 018 0v4" />
                                    <circle cx="12" cy="16" r="1.5" fill="rgba(200,75,47,0.8)" stroke="none" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="left-bottom">
                        <div className="panel-quote">
                            <div className="quote-text">"Security is not a product, but a process."</div>
                            <div className="quote-meta">Account Recovery</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="forgot-right">
                    {/* Step indicator */}
                    <div className="step-indicator">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`step-dot ${s === step ? 'active' : ''} ${s < step ? 'done' : ''}`}>
                                {s < step ? (
                                    <svg viewBox="0 0 12 12" fill="currentColor"><path d="M10.28 2.28a.75.75 0 00-1.06-1.06L4.5 5.94 2.78 4.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l5.25-5.25z" /></svg>
                                ) : s}
                            </div>
                        ))}
                    </div>

                    <div className="form-eyebrow">{currentStep.eyebrow}</div>
                    <h1 className="form-title">{currentStep.title}</h1>
                    <p className="form-sub">{currentStep.sub}</p>

                    {error && (
                        <div className="forgot-alert forgot-alert-error">
                            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" /></svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="forgot-alert forgot-alert-success">
                            <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.78 5.28a.75.75 0 00-1.06-1.06L7.25 8.69 5.28 6.72a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.06 0l4-4z" /></svg>
                            <span>{success}</span>
                        </div>
                    )}

                    {/* STEP 1: Email */}
                    {step === 1 && (
                        <form className="forgot-form" onSubmit={handleSendCode} noValidate>
                            <div className="forgot-field">
                                <label className="forgot-field-label" htmlFor="forgot-email">Email address</label>
                                <div className="forgot-field-wrap">
                                    <div className="forgot-field-icon">
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="2" /><path d="M1 5l7 5 7-5" /></svg>
                                    </div>
                                    <input
                                        type="email" id="forgot-email"
                                        className={fieldErrors.email ? 'input-error' : ''}
                                        placeholder="you@company.com"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                                        autoComplete="email"
                                        autoFocus
                                    />
                                </div>
                                {fieldErrors.email && (
                                    <div className="forgot-field-error">
                                        <svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 0a6 6 0 100 12A6 6 0 006 0zm0 2a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 016 2zm0 6.5a.875.875 0 110 1.75.875.875 0 010-1.75z" /></svg>
                                        {fieldErrors.email}
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? <div className="forgot-spinner"></div> : (
                                    <>
                                        <span>Send verification code</span>
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* STEP 2: Code */}
                    {step === 2 && (
                        <form className="forgot-form" onSubmit={handleVerifyCode} noValidate>
                            <div className="forgot-field">
                                <label className="forgot-field-label" htmlFor="forgot-code">Verification code</label>
                                <div className="forgot-field-wrap">
                                    <div className="forgot-field-icon">
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="12" height="8" rx="1.5" /><path d="M5 5V4a3 3 0 016 0v1" /><circle cx="8" cy="9.5" r="1" /></svg>
                                    </div>
                                    <input
                                        type="text" id="forgot-code"
                                        className={fieldErrors.code ? 'input-error' : ''}
                                        placeholder="Enter 6-digit code"
                                        value={code}
                                        onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); clearFieldError('code'); }}
                                        autoComplete="one-time-code"
                                        inputMode="numeric"
                                        maxLength={6}
                                        autoFocus
                                    />
                                </div>
                                {fieldErrors.code && (
                                    <div className="forgot-field-error">
                                        <svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 0a6 6 0 100 12A6 6 0 006 0zm0 2a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 016 2zm0 6.5a.875.875 0 110 1.75.875.875 0 010-1.75z" /></svg>
                                        {fieldErrors.code}
                                    </div>
                                )}
                            </div>

                            <div className="resend-row">
                                <span className="resend-text">Didn't receive the code?</span>
                                <button
                                    type="button"
                                    className={`resend-btn ${resendCooldown > 0 ? 'disabled' : ''}`}
                                    onClick={handleResendCode}
                                    disabled={resendCooldown > 0 || loading}
                                >
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                                </button>
                            </div>

                            <button type="submit" className="btn-submit" disabled={loading || code.length < 4}>
                                {loading ? <div className="forgot-spinner"></div> : (
                                    <>
                                        <span>Verify code</span>
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* STEP 3: New Password */}
                    {step === 3 && (
                        <form className="forgot-form" onSubmit={handleResetPassword} noValidate>
                            <div className="forgot-field">
                                <label className="forgot-field-label" htmlFor="forgot-new-pw">New password</label>
                                <div className="forgot-field-wrap">
                                    <div className="forgot-field-icon">
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5 7V5a3 3 0 016 0v2" /></svg>
                                    </div>
                                    <input
                                        type={showPw ? 'text' : 'password'} id="forgot-new-pw"
                                        className={fieldErrors.newPassword ? 'input-error' : ''}
                                        placeholder="At least 6 characters"
                                        value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); clearFieldError('newPassword'); }}
                                        autoComplete="new-password"
                                        autoFocus
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
                                {fieldErrors.newPassword && (
                                    <div className="forgot-field-error">
                                        <svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 0a6 6 0 100 12A6 6 0 006 0zm0 2a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 016 2zm0 6.5a.875.875 0 110 1.75.875.875 0 010-1.75z" /></svg>
                                        {fieldErrors.newPassword}
                                    </div>
                                )}
                            </div>

                            <div className="forgot-field">
                                <label className="forgot-field-label" htmlFor="forgot-confirm-pw">Confirm password</label>
                                <div className="forgot-field-wrap">
                                    <div className="forgot-field-icon">
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5 7V5a3 3 0 016 0v2" /></svg>
                                    </div>
                                    <input
                                        type={showConfirmPw ? 'text' : 'password'} id="forgot-confirm-pw"
                                        className={fieldErrors.confirmPassword ? 'input-error' : ''}
                                        placeholder="Re-enter your new password"
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
                                        autoComplete="new-password"
                                    />
                                    <button type="button" className="toggle-pw" onClick={() => setShowConfirmPw(!showConfirmPw)} aria-label="Toggle password">
                                        {showConfirmPw ? (
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
                                {fieldErrors.confirmPassword && (
                                    <div className="forgot-field-error">
                                        <svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 0a6 6 0 100 12A6 6 0 006 0zm0 2a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 016 2zm0 6.5a.875.875 0 110 1.75.875.875 0 010-1.75z" /></svg>
                                        {fieldErrors.confirmPassword}
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? <div className="forgot-spinner"></div> : (
                                    <>
                                        <span>Reset password</span>
                                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="back-to-login">
                        <Link to="/login">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 8H3M7 4L3 8l4 4" /></svg>
                            Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
