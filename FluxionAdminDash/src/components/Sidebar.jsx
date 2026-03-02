import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

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
                <div className="user-avatar">{user?.name?.[0] || 'A'}</div>
                <div className="user-info">
                    <div className="user-name">{user?.name || 'Admin'}</div>
                    <div className="user-role">{user?.role || 'Super Admin'}</div>
                </div>
                <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </div>
        </aside>
    );
}
