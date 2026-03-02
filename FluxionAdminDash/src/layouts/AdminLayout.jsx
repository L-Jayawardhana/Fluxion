import { Outlet, NavLink } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function AdminLayout() {
    return (
        <div className="admin-layout">
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
