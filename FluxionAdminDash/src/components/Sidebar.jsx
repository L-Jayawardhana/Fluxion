import { NavLink } from 'react-router-dom';

export default function Sidebar() {
    return (
        <aside className="sidebar">
            {/* Brand */}
            <div className="sidebar-brand">
                <img src="/LOGOblack.png" alt="Fluxion" className="sidebar-logo" />
                <h2>FLUXION</h2>
                <span>Admin</span>
            </div>

            {/* Navigation */}
            <div className="sidebar-section-label">Main</div>
            <nav className="sidebar-nav">
                <NavLink to="/" end className="nav-link">
                    Dashboard
                </NavLink>
                <NavLink to="/users" className="nav-link">
                    Users
                </NavLink>
                <NavLink to="/organizations" className="nav-link">
                    Organizations
                </NavLink>
            </nav>

            <div className="sidebar-section-label">System</div>
            <nav className="sidebar-nav">
                <NavLink to="/settings" className="nav-link">
                    Settings
                </NavLink>
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="user-avatar">A</div>
                <div className="user-info">
                    <div className="user-name">Admin</div>
                    <div className="user-role">Super Admin</div>
                </div>
                <button className="btn-logout">Logout</button>
            </div>
        </aside>
    );
}
