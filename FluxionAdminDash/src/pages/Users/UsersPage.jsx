export default function UsersPage() {
    return (
        <div className="page">
            <div className="topbar">
                <h1>Users</h1>
                <div className="topbar-actions">
                    <input type="text" className="search-input" placeholder="Search users..." />
                    <button className="btn btn-primary btn-sm">+ Add User</button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Organization</th>
                            <th>Role</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>John Doe</td>
                            <td>john@example.com</td>
                            <td>Acme Corp</td>
                            <td>Admin</td>
                            <td><span className="badge badge-success">Active</span></td>
                        </tr>
                        <tr>
                            <td>Sarah Smith</td>
                            <td>sarah@example.com</td>
                            <td>TechStart Inc</td>
                            <td>Manager</td>
                            <td><span className="badge badge-success">Active</span></td>
                        </tr>
                        <tr>
                            <td>Mike Johnson</td>
                            <td>mike@example.com</td>
                            <td>BuildRight LLC</td>
                            <td>User</td>
                            <td><span className="badge badge-warning">Pending</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
