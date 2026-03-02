export default function SettingsPage() {
    return (
        <div className="page">
            <div className="topbar">
                <h1>Settings</h1>
            </div>

            <div className="table-container" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>General</h2>

                <div className="form-group">
                    <label>Application Name</label>
                    <input type="text" defaultValue="Fluxion" />
                </div>

                <div className="form-group">
                    <label>Support Email</label>
                    <input type="email" defaultValue="support@fluxion.com" />
                </div>

                <div className="form-group">
                    <label>Default User Role</label>
                    <select defaultValue="user">
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <button className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                    Save Changes
                </button>
            </div>
        </div>
    );
}
