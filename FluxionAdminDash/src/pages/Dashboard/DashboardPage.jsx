export default function DashboardPage() {
    return (
        <div className="page">
            <div className="topbar">
                <h1>Dashboard</h1>
                <div className="topbar-actions">
                    <input type="text" className="search-input" placeholder="Search..." />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="stat-cards">
                <div className="stat-card">
                    <h3>Total Users</h3>
                    <div className="stat-value">1,284</div>
                    <div className="stat-change up">+12% this month</div>
                </div>
                <div className="stat-card">
                    <h3>Organizations</h3>
                    <div className="stat-value">48</div>
                    <div className="stat-change up">+3 new</div>
                </div>
                <div className="stat-card">
                    <h3>Active Assets</h3>
                    <div className="stat-value">5,721</div>
                    <div className="stat-change up">+8% this month</div>
                </div>
                <div className="stat-card">
                    <h3>Open Tickets</h3>
                    <div className="stat-value">23</div>
                    <div className="stat-change down">-5% this week</div>
                </div>
            </div>

            {/* Recent Activity Table */}
            <div className="table-container">
                <div className="table-header">
                    <h2>Recent Activity</h2>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Action</th>
                            <th>Organization</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>john@example.com</td>
                            <td>Created asset</td>
                            <td>Acme Corp</td>
                            <td><span className="badge badge-success">Completed</span></td>
                            <td>2 min ago</td>
                        </tr>
                        <tr>
                            <td>sarah@example.com</td>
                            <td>Updated profile</td>
                            <td>TechStart Inc</td>
                            <td><span className="badge badge-info">Processing</span></td>
                            <td>15 min ago</td>
                        </tr>
                        <tr>
                            <td>mike@example.com</td>
                            <td>Submitted ticket</td>
                            <td>BuildRight LLC</td>
                            <td><span className="badge badge-warning">Pending</span></td>
                            <td>1 hr ago</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
