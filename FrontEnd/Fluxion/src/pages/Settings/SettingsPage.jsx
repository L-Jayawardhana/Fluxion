import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getPlan, updatePlan } from '../../services/subscriptionService';
import { getOrganizations, getUsers, updateOrganization, updateUser } from '../../services/api';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [currentUserData, setCurrentUserData] = useState(null);
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [activeTab, setActiveTab] = useState('billing');
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg(null);
    } else {
      setSuccessMsg(msg);
      setErrorMsg(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  useEffect(() => {
    if (user?.orgId) {
      Promise.all([
        getPlan(user.orgId).catch(() => ({ planName: 'Free' })),
        getUsers(user.orgId).catch(() => []),
        getOrganizations().catch(() => [])
      ])
      .then(([planRes, usersRes, orgsRes]) => {
        setCurrentPlan(planRes.planName);
        const matchedUser = usersRes.find(u => u.userId == user.userId);
        if (matchedUser) setCurrentUserData(matchedUser);

        const matchedOrg = orgsRes.find(o => o.orgId == user.orgId);
        if (matchedOrg) setOrgData(matchedOrg);
      })
      .catch((err) => console.error("Error fetching settings data:", err))
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleUserUpdate = async (e) => {
    e.preventDefault();
    if (!currentUserData) return;
    setUpdating(true);
    try {
      await updateUser(currentUserData.userId, {
        userId: currentUserData.userId,
        orgId: currentUserData.orgId,
        fullName: currentUserData.fullName,
        email: currentUserData.email,
        role: currentUserData.role || 'employee',
        isActive: currentUserData.isActive ?? true
      });
      showMessage('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      showMessage('Failed to update profile.', true);
    } finally {
      setUpdating(false);
    }
  };

  const handleOrgUpdate = async (e) => {
    e.preventDefault();
    if (!orgData) return;
    setUpdating(true);
    try {
      await updateOrganization(orgData.orgId, {
        orgId: orgData.orgId,
        orgName: orgData.orgName,
        slug: orgData.slug,
        timezone: orgData.timezone,
        isActive: orgData.isActive ?? true
      });
      showMessage('Organization profile updated successfully!');
    } catch (err) {
      console.error(err);
      showMessage('Failed to update organization profile.', true);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePlan = (planName) => {
    if (!user?.orgId) return;
    setUpdating(true);
    showMessage(null); // Clear errors
    updatePlan(user.orgId, planName)
      .then(() => {
        setCurrentPlan(planName);
        setIsChangingPlan(false); // Hide the plans after successful update
        showMessage('Plan updated successfully!');
        window.dispatchEvent(new CustomEvent('planChanged', { detail: planName }));
      })
      .catch((err) => {
        showMessage(err.response?.data?.message || err.message, true);
      })
      .finally(() => setUpdating(false));
  };

  if (loading) return <div className="settings-loading">Loading settings...</div>;

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account settings and preferences.</p>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <nav>
            <button 
              className={activeTab === 'general' ? 'active' : ''} 
              onClick={() => { setActiveTab('general'); showMessage(null); }}
            >
              General
            </button>
            <button 
              className={activeTab === 'organization' ? 'active' : ''} 
              onClick={() => { setActiveTab('organization'); showMessage(null); }}
            >
              Organization Profile
            </button>
            <button 
              className={activeTab === 'billing' ? 'active' : ''} 
              onClick={() => { setActiveTab('billing'); setIsChangingPlan(false); showMessage(null); }}
            >
              Billing & Plans
            </button>
            <button 
              className={activeTab === 'notifications' ? 'active' : ''} 
              onClick={() => { setActiveTab('notifications'); showMessage(null); }}
            >
              Notifications
            </button>
          </nav>
        </aside>

        <main className="settings-content">
          {errorMsg && (
            <div className="alert-error global-alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <div>
                <strong>Action Failed:</strong> {errorMsg}
              </div>
            </div>
          )}
          {successMsg && (
            <div className="alert-success global-alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <div>
                <strong>Success:</strong> {successMsg}
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="settings-section">
              <h2>General Settings</h2>
              <p className="section-desc">Manage your personal account details.</p>
              <form className="settings-form" onSubmit={handleUserUpdate}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={currentUserData?.fullName || ''} 
                    onChange={e => setCurrentUserData({ ...currentUserData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={currentUserData?.email || user?.email || ''} disabled />
                  <span className="help-text">Email address cannot be changed.</span>
                </div>
                <button type="submit" className="btn-save" disabled={updating || !currentUserData}>Save Changes</button>
              </form>
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="settings-section">
              <h2>Organization Profile</h2>
              <p className="section-desc">Update your workspace details and branding.</p>
              <form className="settings-form" onSubmit={handleOrgUpdate}>
                <div className="form-group">
                  <label>Workspace Name</label>
                  <input 
                    type="text" 
                    value={orgData?.orgName || ''} 
                    onChange={e => setOrgData({ ...orgData, orgName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Workspace Slug</label>
                  <input 
                    type="text" 
                    value={orgData?.slug || ''} 
                    onChange={e => setOrgData({ ...orgData, slug: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Timezone</label>
                  <select 
                    value={orgData?.timezone || 'UTC'}
                    onChange={e => setOrgData({ ...orgData, timezone: e.target.value })}
                  >
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="EST">EST (Eastern Standard Time)</option>
                    <option value="PST">PST (Pacific Standard Time)</option>
                  </select>
                </div>
                <button type="submit" className="btn-save" disabled={updating || !orgData}>Update Profile</button>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notification Preferences</h2>
              <p className="section-desc">Choose how you receive alerts and updates.</p>
              <div className="settings-list">
                <div className="setting-item">
                  <div>
                    <h4>Email Notifications</h4>
                    <p>Receive updates about tickets and assets via email.</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div>
                    <h4>Monthly Reports</h4>
                    <p>Receive a monthly summary of your workspace activity.</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="settings-section billing-section">
              <div className="billing-header">
                <div>
                  <h2>Billing & Plans</h2>
                  <p className="section-desc">Manage your subscription, limits, and billing method.</p>
                </div>
                {!isChangingPlan && (
                  <button className="btn-change-plan" onClick={() => setIsChangingPlan(true)}>
                    Change Plan
                  </button>
                )}
              </div>

              {!isChangingPlan ? (
                <div className="current-plan-summary">
                  <div className="cps-labels">
                    <span className="cps-title">Current Plan</span>
                    <span className="cps-badge">{currentPlan}</span>
                  </div>
                  <p className="cps-desc">
                    Your workspace is currently operating under the <strong>{currentPlan}</strong> limits.
                    {currentPlan === 'Free' && ' Upgrade to unlock more users and assets.'}
                    {currentPlan === 'Pro' && ' You have access to advanced analytics.'}
                  </p>
                </div>
              ) : (
                <div className="plan-change-view">
                  <button className="btn-back" onClick={() => { setIsChangingPlan(false); setErrorMsg(null); }}>
                    ← Back to Summary
                  </button>
                  <div className="plans-wrapper">
                    <div className={`plan-card ${currentPlan === 'Free' ? 'active-plan' : ''}`}>
                      <div className="plan-header">
                        <h2>Free</h2>
                        <div className="plan-price">
                          <span className="currency">$</span>
                          <span className="amount">0</span>
                        </div>
                        <p className="plan-period">forever</p>
                      </div>
                      
                      <ul className="plan-features">
                        <li><span className="feature-marker">→</span> Up to 5 users</li>
                        <li><span className="feature-marker">→</span> Up to 50 assets</li>
                        <li><span className="feature-marker">→</span> Maintenance tickets</li>
                        <li><span className="feature-marker">→</span> Basic dashboard</li>
                        <li className="dimmed"><span className="feature-marker">—</span> QR code labels</li>
                        <li className="dimmed"><span className="feature-marker">—</span> PDF / CSV export</li>
                      </ul>

                      <button 
                        className="plan-button"
                        onClick={() => handleUpdatePlan('Free')}
                        disabled={updating || currentPlan === 'Free'}
                      >
                        {updating && currentPlan !== 'Free' ? 'Processing...' : currentPlan === 'Free' ? 'CURRENT PLAN' : 'DOWNGRADE'}
                      </button>
                    </div>

                    <div className={`plan-card pro ${currentPlan === 'Pro' ? 'active-plan' : ''}`}>
                      <div className="most-popular">MOST POPULAR</div>
                      <div className="plan-header">
                        <h2>Pro</h2>
                        <div className="plan-price">
                          <span className="currency">$</span>
                          <span className="amount">29</span>
                        </div>
                        <p className="plan-period">per month · up to 25 users</p>
                      </div>
                      
                      <ul className="plan-features">
                        <li><span className="feature-marker red-arrow">→</span> Up to 25 users</li>
                        <li><span className="feature-marker red-arrow">→</span> Up to 500 assets</li>
                        <li><span className="feature-marker red-arrow">→</span> Maintenance tickets</li>
                        <li><span className="feature-marker red-arrow">→</span> Full dashboard & analytics</li>
                        <li><span className="feature-marker red-arrow">→</span> QR code labels</li>
                        <li><span className="feature-marker red-arrow">→</span> PDF / CSV export</li>
                      </ul>

                      <button 
                        className="plan-button white"
                        onClick={() => handleUpdatePlan('Pro')}
                        disabled={updating || currentPlan === 'Pro'}
                      >
                        {updating && currentPlan !== 'Pro' ? 'Processing...' : currentPlan === 'Pro' ? 'CURRENT PLAN' : 'UPGRADE TO PRO'}
                      </button>
                    </div>

                    <div className={`plan-card ${currentPlan === 'Enterprise' ? 'active-plan' : ''}`}>
                      <div className="plan-header">
                        <h2>Enterprise</h2>
                        <div className="plan-price">
                          <span className="currency">$</span>
                          <span className="amount">199</span>
                        </div>
                        <p className="plan-period">per month · unlimited users</p>
                      </div>
                      
                      <ul className="plan-features">
                        <li><span className="feature-marker red-arrow">→</span> Unlimited users</li>
                        <li><span className="feature-marker red-arrow">→</span> Unlimited assets</li>
                        <li><span className="feature-marker red-arrow">→</span> Maintenance tickets</li>
                        <li><span className="feature-marker red-arrow">→</span> Full dashboard & analytics</li>
                        <li><span className="feature-marker red-arrow">→</span> QR code labels</li>
                        <li><span className="feature-marker red-arrow">→</span> PDF / CSV export</li>
                      </ul>

                      <button 
                        className="plan-button"
                        onClick={() => handleUpdatePlan('Enterprise')}
                        disabled={updating || currentPlan === 'Enterprise'}
                      >
                        {updating && currentPlan !== 'Enterprise' ? 'Processing...' : currentPlan === 'Enterprise' ? 'CURRENT PLAN' : 'UPGRADE TO ENTERPRISE'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
