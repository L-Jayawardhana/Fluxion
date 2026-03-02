import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import NewOrgModal from '../components/NewOrgModal';

export default function AdminLayout() {
    const [showNewOrg, setShowNewOrg] = useState(false);

    return (
        <div className="shell">
            <Sidebar />
            <div className="main">
                <Topbar onNewOrg={() => setShowNewOrg(true)} />
                <div className="content">
                    <Outlet />
                </div>
            </div>
            <NewOrgModal open={showNewOrg} onClose={() => setShowNewOrg(false)} />
        </div>
    );
}
