export default function OrganizationsPage() {
    return (
        <div className="page">
            <div className="topbar">
                <h1>Organizations</h1>
                <div className="topbar-actions">
                    <input type="text" className="search-input" placeholder="Search organizations..." />
                    <button className="btn btn-primary btn-sm">+ Add Organization</button>
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Organization</th>
                            <th>Members</th>
                            <th>Assets</th>
                            <th>Plan</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Acme Corp</td>
                            <td>45</td>
                            <td>1,230</td>
                            <td>Enterprise</td>
                            <td><span className="badge badge-success">Active</span></td>
                        </tr>
                        <tr>
                            <td>TechStart Inc</td>
                            <td>12</td>
                            <td>340</td>
                            <td>Pro</td>
                            <td><span className="badge badge-success">Active</span></td>
                        </tr>
                        <tr>
                            <td>BuildRight LLC</td>
                            <td>8</td>
                            <td>156</td>
                            <td>Free</td>
                            <td><span className="badge badge-warning">Trial</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
