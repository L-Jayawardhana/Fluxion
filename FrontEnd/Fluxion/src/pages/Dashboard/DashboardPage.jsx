import { useAuth } from '../../hooks/useAuth';

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <div className="page">
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.email}!</p>
            <div className="dashboard-cards">
                <div className="card">
                    <h3>Assets</h3>
                    <p className="card-value">—</p>
                </div>
                <div className="card">
                    <h3>Maintenance</h3>
                    <p className="card-value">—</p>
                </div>
                <div className="card">
                    <h3>Users</h3>
                    <p className="card-value">—</p>
                </div>
            </div>
        </div>
    );
}
