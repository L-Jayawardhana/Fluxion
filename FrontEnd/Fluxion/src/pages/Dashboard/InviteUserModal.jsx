import { useState, useEffect } from 'react';
import api from '../../services/api';
import './InviteUserModal.css';

export default function InviteUserModal({ isOpen, onClose, orgId, onUserInvited }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    departmentId: '',
    role: 'user',
  });
  
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch departments when modal opens
  useEffect(() => {
    if (!isOpen || !orgId) return;

    let cancelled = false;
    setLoadingDepts(true);
    
    api.get(`/Department?orgId=${orgId}`)
      .then(res => {
        if (!cancelled) {
          // Filter to active departments
          const activeDepts = res.data.filter(d => d.isActive);
          setDepartments(activeDepts);
          if (activeDepts.length > 0) {
            setFormData(prev => ({ ...prev, departmentId: activeDepts[0].departmentId }));
          }
        }
      })
      .catch(err => {
        console.error("Failed to load departments:", err);
      })
      .finally(() => {
        if (!cancelled) setLoadingDepts(false);
      });

    return () => { cancelled = true; };
  }, [isOpen, orgId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ firstName: '', lastName: '', email: '', password: '', departmentId: '', role: 'user' });
      setErrorMsg('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        orgId: parseInt(orgId, 10),
        departmentId: parseInt(formData.departmentId, 10),
        role: formData.role,
      };

      await api.post('/User/employee', payload);
      
      if (onUserInvited) onUserInvited();
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="invite-modal-overlay">
      <div className="invite-modal-container scale-in">
        <div className="invite-modal-header">
          <h3>Register & Invite Employee</h3>
          <button className="invite-close-btn" onClick={onClose} disabled={isSubmitting}>×</button>
        </div>
        
        <form className="invite-modal-body" onSubmit={handleSubmit}>
          {errorMsg && <div className="invite-error-box">{errorMsg}</div>}
          
          <div className="invite-form-row">
            <div className="invite-form-group">
              <label>First Name</label>
              <input 
                type="text" name="firstName" required 
                value={formData.firstName} onChange={handleChange}
                placeholder="e.g. Jane" disabled={isSubmitting}
              />
            </div>
            <div className="invite-form-group">
              <label>Last Name</label>
              <input 
                type="text" name="lastName" required 
                value={formData.lastName} onChange={handleChange}
                placeholder="e.g. Doe" disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="invite-form-group">
            <label>Email Address</label>
            <input 
              type="email" name="email" required 
              value={formData.email} onChange={handleChange}
              placeholder="jane.doe@company.com" disabled={isSubmitting}
            />
            <small>An invitation link will be sent to this email.</small>
          </div>

          <div className="invite-form-group">
            <label>Initial Password</label>
            <input 
              type="password" name="password" required minLength="8"
              value={formData.password} onChange={handleChange}
              placeholder="Minimum 8 characters" disabled={isSubmitting}
            />
            <small>The employee must change this upon first login.</small>
          </div>

          <div className="invite-form-row">
            <div className="invite-form-group">
              <label>Role</label>
              <select 
                name="role" required
                value={formData.role} onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="user">Employee</option>
                <option value="technician">Technician</option>
              </select>
            </div>
            
            <div className="invite-form-group">
              <label>Department</label>
              <select 
                name="departmentId" required
                value={formData.departmentId} onChange={handleChange}
                disabled={isSubmitting || loadingDepts || departments.length === 0}
              >
                {loadingDepts && <option value="">Loading...</option>}
                {!loadingDepts && departments.length === 0 && <option value="">No Active Departments</option>}
                {!loadingDepts && departments.map(d => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="invite-modal-footer">
            <button type="button" className="invite-btn-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" className="invite-btn-submit" disabled={isSubmitting || departments.length === 0}>
              {isSubmitting ? 'Sending...' : 'Register & Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
