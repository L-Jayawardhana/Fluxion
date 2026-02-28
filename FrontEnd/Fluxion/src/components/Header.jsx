import { Link } from 'react-router-dom';

export default function Header({ scrollToSection }) {
    return (
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
    );
}
