import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function MainLayout() {
    const { user, logout } = useAuth();

    return (
        <div className="main-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h2>Fluxion</h2>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/welcome" className="nav-link">Welcome</NavLink>
                    <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
                    <NavLink to="/assets" className="nav-link">Assets</NavLink>
                    <NavLink to="/maintenance" className="nav-link">Maintenance</NavLink>
                    <NavLink to="/users" className="nav-link">Users</NavLink>
                </nav>
                <div className="sidebar-footer">
                    <span className="user-name">{user?.email}</span>
                    <button onClick={logout} className="btn-logout">Logout</button>
                </div>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
