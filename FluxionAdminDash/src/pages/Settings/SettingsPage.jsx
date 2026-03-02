export default function SettingsPage() {
    return (
        <div style={{ padding: '20px 24px 40px' }}>
            <div className="panel">
                <div className="ph">
                    <div>
                        <div className="ph-title">General Settings</div>
                        <div className="ph-sub">System-wide configuration</div>
                    </div>
                </div>
                <div style={{ padding: '20px 24px' }}>
                    <div className="mf">
                        <label className="ml">Application Name</label>
                        <input className="mi" type="text" defaultValue="EAMMS" />
                    </div>
                    <div className="mf">
                        <label className="ml">Support Email</label>
                        <input className="mi" type="email" defaultValue="support@eamms.com" />
                    </div>
                    <div className="m2">
                        <div className="mf">
                            <label className="ml">Default User Role</label>
                            <select className="ms" defaultValue="user">
                                <option value="user">User</option>
                                <option value="technician">Technician</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="mf">
                            <label className="ml">Default Plan</label>
                            <select className="ms" defaultValue="free">
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                    </div>
                    <div className="mf">
                        <label className="ml">Session Timeout (minutes)</label>
                        <input className="mi" type="number" defaultValue={30} />
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <button className="mok">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
