import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
    const cursorDotRef = useRef(null);
    const cursorRingRef = useRef(null);

    const scrollToSection = (e, id) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    useEffect(() => {
        const dot = cursorDotRef.current;
        const ring = cursorRingRef.current;
        if (!dot || !ring) return;

        let mx = 0, my = 0, rx = 0, ry = 0;

        const onMouseMove = (e) => {
            mx = e.clientX;
            my = e.clientY;
            dot.style.left = mx + 'px';
            dot.style.top = my + 'px';
        };

        let animId;
        const animateRing = () => {
            rx += (mx - rx) * 0.12;
            ry += (my - ry) * 0.12;
            ring.style.left = rx + 'px';
            ring.style.top = ry + 'px';
            animId = requestAnimationFrame(animateRing);
        };

        document.addEventListener('mousemove', onMouseMove);
        animateRing();

        // Hover state for interactive elements
        const interactives = document.querySelectorAll('a, button');
        const onEnter = () => {
            ring.style.transform = 'translate(-50%,-50%) scale(1.6)';
            ring.style.opacity = '0.3';
            dot.style.transform = 'translate(-50%,-50%) scale(0.5)';
        };
        const onLeave = () => {
            ring.style.transform = 'translate(-50%,-50%) scale(1)';
            ring.style.opacity = '0.6';
            dot.style.transform = 'translate(-50%,-50%) scale(1)';
        };
        interactives.forEach((el) => {
            el.addEventListener('mouseenter', onEnter);
            el.addEventListener('mouseleave', onLeave);
        });

        // Scroll reveal
        const reveals = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => entry.target.classList.add('visible'), 80);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );
        reveals.forEach((el) => observer.observe(el));

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(animId);
            interactives.forEach((el) => {
                el.removeEventListener('mouseenter', onEnter);
                el.removeEventListener('mouseleave', onLeave);
            });
            observer.disconnect();
        };
    }, []);

    return (
        <div className="landing">
            {/* Custom cursor */}
            <div className="cursor" id="cursor">
                <div className="cursor-ring" ref={cursorRingRef}></div>
                <div className="cursor-dot" ref={cursorDotRef}></div>
            </div>

            {/* NAV */}
            <nav>
                <a href="#" className="nav-logo">
                    <img src="/LOGOblack.png" alt="FLUXION" className="nav-logo-img" />
                    FLUXION
                </a>
                <ul className="nav-links">
                    <li><a href="#how" onClick={(e) => scrollToSection(e, 'how')}>How it works</a></li>
                    <li><a href="#features" onClick={(e) => scrollToSection(e, 'features')}>Features</a></li>
                    <li><a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')}>Pricing</a></li>
                    <li><a href="#roles" onClick={(e) => scrollToSection(e, 'roles')}>Roles</a></li>
                </ul>
                <div className="nav-cta">
                    <Link to="/login" className="btn-ghost">Sign in</Link>
                    <Link to="/register" className="btn-primary-nav">Start free →</Link>
                </div>
            </nav>

            {/* HERO */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-eyebrow">Enterprise Asset Management</div>
                    <h1 className="hero-title">
                        Every asset.<br />
                        Every ticket.<br />
                        <em>Under control.</em>
                    </h1>
                    <p className="hero-sub">
                        FLUXION is a multi-tenant SaaS platform that helps organisations track physical assets, manage maintenance, and give every team member exactly the access they need.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="btn-large">
                            Get started free
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                        </Link>
                        <a href="#how" className="btn-outline" onClick={(e) => scrollToSection(e, 'how')}>See how it works</a>
                    </div>
                    <div className="hero-stats">
                        <div className="stat-item">
                            <div className="stat-num">10k+</div>
                            <div className="stat-label">Assets tracked</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-num">98%</div>
                            <div className="stat-label">Uptime SLA</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-num">4</div>
                            <div className="stat-label">Role layers</div>
                        </div>
                    </div>
                </div>

                <div className="hero-visual">
                    <div style={{ position: 'relative' }}>
                        <div className="float-tag tag-1">
                            <div className="float-icon" style={{ background: '#E8F5E9' }}>✅</div>
                            <span style={{ fontSize: '11px', color: '#2D2D2D' }}>Ticket resolved</span>
                        </div>
                        <div className="float-tag tag-2">
                            <div className="float-icon" style={{ background: '#FFF3E0' }}>🔧</div>
                            <span style={{ fontSize: '11px', color: '#2D2D2D' }}>3 in maintenance</span>
                        </div>

                        <div className="dashboard-card">
                            <div className="card-header">
                                <span className="card-title">Dashboard Overview</span>
                                <span className="card-dot"></span>
                            </div>
                            <div className="metric-row">
                                <div className="metric-box">
                                    <div className="metric-val">248</div>
                                    <div className="metric-lbl">Total Assets</div>
                                </div>
                                <div className="metric-box">
                                    <div className="metric-val rust">12</div>
                                    <div className="metric-lbl">Open Tickets</div>
                                </div>
                                <div className="metric-box">
                                    <div className="metric-val green">94%</div>
                                    <div className="metric-lbl">Availability</div>
                                </div>
                            </div>
                            <div className="bar-section">
                                <div className="bar-label"><span>Laptops assigned</span><span style={{ color: 'rgba(255,255,255,0.5)' }}>72%</span></div>
                                <div className="bar-track"><div className="bar-fill r"></div></div>
                            </div>
                            <div className="bar-section">
                                <div className="bar-label"><span>Vehicles in use</span><span style={{ color: 'rgba(255,255,255,0.5)' }}>45%</span></div>
                                <div className="bar-track"><div className="bar-fill a"></div></div>
                            </div>
                            <div className="bar-section" style={{ marginBottom: '20px' }}>
                                <div className="bar-label"><span>Tickets resolved</span><span style={{ color: 'rgba(255,255,255,0.5)' }}>88%</span></div>
                                <div className="bar-track"><div className="bar-fill g"></div></div>
                            </div>
                            <div className="ticket-list">
                                <div className="ticket-item">
                                    <div className="t-dot open"></div>
                                    <div className="t-text">MacBook Pro — Screen flicker</div>
                                    <div className="t-badge high">High</div>
                                </div>
                                <div className="ticket-item">
                                    <div className="t-dot prog"></div>
                                    <div className="t-text">Canon Printer — Paper jam</div>
                                    <div className="t-badge med">Med</div>
                                </div>
                                <div className="ticket-item">
                                    <div className="t-dot done"></div>
                                    <div className="t-text">Toyota Hilux — Oil change</div>
                                    <div className="t-badge low">Done</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MARQUEE */}
            <div className="marquee-section">
                <div className="marquee-track">
                    {[...Array(2)].map((_, i) => (
                        <span key={i} style={{ display: 'contents' }}>
                            <span className="marquee-item">Asset Registry <span className="marquee-sep">✦</span></span>
                            <span className="marquee-item">QR Code Labels <span className="marquee-sep">✦</span></span>
                            <span className="marquee-item">Maintenance Tickets <span className="marquee-sep">✦</span></span>
                            <span className="marquee-item">Role-Based Access <span className="marquee-sep">✦</span></span>
                            <span className="marquee-item">Warranty Tracking <span className="marquee-sep">✦</span></span>
                            <span className="marquee-item">Cost Reports <span className="marquee-sep">✦</span></span>
                            <span className="marquee-item">Multi-Tenant SaaS <span className="marquee-sep">✦</span></span>
                            <span className="marquee-item">PDF &amp; CSV Export <span className="marquee-sep">✦</span></span>
                        </span>
                    ))}
                </div>
            </div>

            {/* HOW IT WORKS */}
            <section className="section" id="how">
                <div className="section-label reveal">How it works</div>
                <h2 className="section-title reveal">Four steps from <em>signup</em> to full control.</h2>
                <div className="steps-grid reveal">
                    <div className="step">
                        <div className="step-num">01</div>
                        <div className="step-icon">🏢</div>
                        <div className="step-title">Register your org</div>
                        <div className="step-desc">Owner signs up, picks a plan, and your organisation workspace is live instantly.</div>
                    </div>
                    <div className="step">
                        <div className="step-num">02</div>
                        <div className="step-icon">👥</div>
                        <div className="step-title">Add your team</div>
                        <div className="step-desc">Invite Admins, Technicians, and Users. Each gets an email with their credentials and is forced to change their password on first login.</div>
                    </div>
                    <div className="step">
                        <div className="step-num">03</div>
                        <div className="step-icon">💻</div>
                        <div className="step-title">Register assets</div>
                        <div className="step-desc">Add every asset — laptops, vehicles, printers, anything. Each gets a unique QR code you can print and attach.</div>
                    </div>
                    <div className="step">
                        <div className="step-num">04</div>
                        <div className="step-icon">🎫</div>
                        <div className="step-title">Manage &amp; maintain</div>
                        <div className="step-desc">Users raise tickets, Admins assign Technicians, and every repair is logged automatically with cost and notes.</div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="section features-section" id="features">
                <div className="section-label reveal">Features</div>
                <h2 className="section-title reveal">Built for <em>real</em> organisations.</h2>
                <div className="features-grid reveal">
                    <div className="feature">
                        <span className="feature-icon">🏷️</span>
                        <div className="feature-title">QR Code Asset Labels</div>
                        <div className="feature-desc">Every registered asset gets an auto-generated QR code. Scan to instantly pull up full asset details, history, and open tickets.</div>
                        <span className="feature-tag">Auto-generated</span>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">🔒</span>
                        <div className="feature-title">Role-Based Access Control</div>
                        <div className="feature-desc">Four roles — Owner, Admin, Technician, User — with precisely scoped permissions. Nobody sees what they shouldn't.</div>
                        <span className="feature-tag">4 roles</span>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">🎫</span>
                        <div className="feature-title">Maintenance Ticket Workflow</div>
                        <div className="feature-desc">Any user can raise a ticket. Admin assigns it to a Technician. Status flows from open to closed with a full audit trail.</div>
                        <span className="feature-tag">6 status stages</span>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">📊</span>
                        <div className="feature-title">Reports &amp; Analytics</div>
                        <div className="feature-desc">Asset register, maintenance cost, warranty expiry, and SLA compliance reports. Export as PDF or CSV in one click.</div>
                        <span className="feature-tag">PDF + CSV</span>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">🏬</span>
                        <div className="feature-title">Department Management</div>
                        <div className="feature-desc">Organise assets and users by department. A user can belong to multiple departments simultaneously.</div>
                        <span className="feature-tag">Multi-department</span>
                    </div>
                    <div className="feature">
                        <span className="feature-icon">🔔</span>
                        <div className="feature-title">Warranty &amp; Cost Tracking</div>
                        <div className="feature-desc">Track purchase dates, warranty expiry, and cumulative maintenance costs per asset — so you know exactly when to replace vs repair.</div>
                        <span className="feature-tag">Full history</span>
                    </div>
                </div>
            </section>

            {/* ROLES */}
            <section className="section roles-section" id="roles">
                <div className="section-label reveal">Access Roles</div>
                <h2 className="section-title reveal">The right access for <em>every</em> person.</h2>
                <div className="roles-grid reveal">
                    <div className="role-card owner">
                        <span className="role-emoji">👑</span>
                        <div className="role-name">Owner</div>
                        <div className="role-sub">Self-registered · 1 per org</div>
                        <ul className="role-perms">
                            <li>Full organisation access</li>
                            <li>Manages subscription &amp; billing</li>
                            <li>Adds and manages Admins</li>
                            <li>All asset &amp; ticket controls</li>
                        </ul>
                    </div>
                    <div className="role-card admin">
                        <span className="role-emoji">🛡️</span>
                        <div className="role-name">Admin</div>
                        <div className="role-sub">Added by Owner</div>
                        <ul className="role-perms">
                            <li>Adds Users &amp; Technicians</li>
                            <li>Manages departments</li>
                            <li>Registers &amp; assigns assets</li>
                            <li>Assigns tickets to Technicians</li>
                        </ul>
                    </div>
                    <div className="role-card tech">
                        <span className="role-emoji">🔧</span>
                        <div className="role-name">Technician</div>
                        <div className="role-sub">Added by Owner or Admin</div>
                        <ul className="role-perms">
                            <li>Add / edit / delete assets</li>
                            <li>View assigned tickets</li>
                            <li>Update ticket status</li>
                            <li>Log repair cost &amp; notes</li>
                        </ul>
                    </div>
                    <div className="role-card user">
                        <span className="role-emoji">👤</span>
                        <div className="role-name">User</div>
                        <div className="role-sub">Added by Owner or Admin</div>
                        <ul className="role-perms">
                            <li>View own assigned assets</li>
                            <li>Raise maintenance tickets</li>
                            <li>Track ticket status</li>
                            <li>View asset QR codes</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section className="section" id="pricing" style={{ background: 'var(--paper)' }}>
                <div className="section-label reveal" style={{ justifyContent: 'center' }}>Pricing</div>
                <h2 className="section-title reveal" style={{ textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>Simple, transparent <em>pricing.</em></h2>
                <div className="pricing-grid reveal">
                    <div className="plan">
                        <div className="plan-name">Free</div>
                        <div className="plan-price">$0</div>
                        <div className="plan-per">forever</div>
                        <ul className="plan-features">
                            <li>Up to 5 users</li>
                            <li>Up to 50 assets</li>
                            <li>Maintenance tickets</li>
                            <li>Basic dashboard</li>
                            <li className="muted">QR code labels</li>
                            <li className="muted">PDF / CSV export</li>
                            <li className="muted">SLA reports</li>
                        </ul>
                        <button className="plan-btn outline">Get started</button>
                    </div>
                    <div className="plan featured">
                        <div className="plan-badge">Most popular</div>
                        <div className="plan-name">Pro</div>
                        <div className="plan-price">$29</div>
                        <div className="plan-per">per month · up to 25 users</div>
                        <ul className="plan-features">
                            <li>Up to 25 users</li>
                            <li>Up to 500 assets</li>
                            <li>Maintenance tickets</li>
                            <li>Full dashboard &amp; analytics</li>
                            <li>QR code labels</li>
                            <li>PDF / CSV export</li>
                            <li className="muted">SLA reports</li>
                        </ul>
                        <button className="plan-btn dark">Start Pro trial</button>
                    </div>
                    <div className="plan">
                        <div className="plan-name">Enterprise</div>
                        <div className="plan-price">Custom</div>
                        <div className="plan-per">contact us</div>
                        <ul className="plan-features">
                            <li>Unlimited users</li>
                            <li>Unlimited assets</li>
                            <li>Maintenance tickets</li>
                            <li>Full dashboard &amp; analytics</li>
                            <li>QR code labels</li>
                            <li>PDF / CSV export</li>
                            <li>SLA reports</li>
                        </ul>
                        <button className="plan-btn outline">Contact sales</button>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section">
                <h2 className="cta-title reveal">Stop losing track of what your company <em>owns.</em></h2>
                <p className="cta-sub reveal">Register in 2 minutes. No credit card required on the free plan.</p>
                <div className="cta-actions reveal">
                    <Link to="/register" className="btn-white">
                        Start for free
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                    </Link>
                    <a href="#" className="btn-white-outline">Book a demo</a>
                </div>
            </section>

            {/* FOOTER */}
            <footer>
                <div className="footer-top">
                    <div className="footer-brand">
                        <a href="#" className="nav-logo">
                            <img src="/LOGOblack.png" alt="FLUXION" className="nav-logo-img footer-logo-img" />
                            FLUXION
                        </a>
                        <p className="footer-desc">Enterprise Asset &amp; Maintenance Management System. Built for organisations that take their physical assets seriously.</p>
                    </div>
                    <div>
                        <div className="footer-col-title">Product</div>
                        <ul className="footer-links">
                            <li><a href="#">Features</a></li>
                            <li><a href="#">Pricing</a></li>
                            <li><a href="#">Changelog</a></li>
                            <li><a href="#">Roadmap</a></li>
                        </ul>
                    </div>
                    <div>
                        <div className="footer-col-title">Company</div>
                        <ul className="footer-links">
                            <li><a href="#">About</a></li>
                            <li><a href="#">Blog</a></li>
                            <li><a href="#">Careers</a></li>
                            <li><a href="#">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <div className="footer-col-title">Legal</div>
                        <ul className="footer-links">
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Service</a></li>
                            <li><a href="#">Security</a></li>
                            <li><a href="#">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <span>© 2025 FLUXION. All rights reserved.</span>
                    <span>IT23746664 · IT23746114 · IT23754652 · IT23689794</span>
                </div>
            </footer>
        </div>
    );
}
