import { useState } from 'react';

export default function NewOrgModal({ open, onClose }) {
  const [form, setForm] = useState({
    name: '',
    slug: '',
    email: '',
    plan: 'free',
    industry: '',
    password: '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: POST to API
    console.log('Create organisation:', form);
    onClose();
    setForm({ name: '', slug: '', email: '', plan: 'free', industry: '', password: '' });
  };

  return (
    <div className={`overlay${open ? ' open' : ''}`} onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">New Organisation</div>
          <button className="modal-x" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="m2">
              <div className="mf">
                <label className="ml">Organisation Name</label>
                <input className="mi" placeholder="Acme Corp" value={form.name} onChange={set('name')} required />
              </div>
              <div className="mf">
                <label className="ml">Slug</label>
                <input className="mi" placeholder="acme-corp" value={form.slug} onChange={set('slug')} required />
              </div>
            </div>
            <div className="mf">
              <label className="ml">Owner Email</label>
              <input className="mi" type="email" placeholder="owner@acme.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="m2">
              <div className="mf">
                <label className="ml">Plan</label>
                <select className="ms" value={form.plan} onChange={set('plan')}>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="mf">
                <label className="ml">Industry</label>
                <input className="mi" placeholder="Technology" value={form.industry} onChange={set('industry')} />
              </div>
            </div>
            <div className="mf">
              <label className="ml">Temporary Password</label>
              <input className="mi" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="mc" onClick={onClose}>Cancel</button>
            <button type="submit" className="mok">Create Organisation</button>
          </div>
        </form>
      </div>
    </div>
  );
}
