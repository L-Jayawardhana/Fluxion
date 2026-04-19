import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './SupportPage.css';

/* ── icon helpers ─────────────────────────────────────────── */
const IC = {
  docs:     <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="1" width="10" height="14" rx="1.5"/><path d="M5 5h6M5 8h6M5 11h3"/></svg>,
  mail:     <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1" y="3" width="14" height="10" rx="1.5"/><path d="M1 4l7 5 7-5"/></svg>,
  chat:     <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 3h12a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 3V4a1 1 0 011-1z"/><path d="M5 7h6M5 9.5h4"/></svg>,
  book:     <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 2h5a2 2 0 012 2v10c0-1.1-.9-2-2-2H2V2z"/><path d="M14 2H9a2 2 0 00-2 2v10a2 2 0 012-2h5V2z"/></svg>,
  chevron:  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6l4 4 4-4"/></svg>,
  arrow:    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>,
  keyboard: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M4 7h1M7 7h2M11 7h1M4 10h1M7 10h2M11 10h1M6 12.5h4"/></svg>,
  faq:      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="7"/><path d="M8 5a2 2 0 110 3.5" strokeLinecap="round"/><circle cx="8" cy="11.5" r=".6" fill="currentColor"/></svg>,
  status:   <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12.5 3.5a7 7 0 10.01 0"/><path d="M6 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  phone:    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M5 2h3l1 3-2 1a8 8 0 004 4l1-2 3 1v3c0 1-4 3-9-2S4 4 5 2z"/></svg>,
  globe:    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="7"/><path d="M8 1v14M1 8h14M2.5 4.5c2 1 4 1.5 5.5 1.5s3.5-.5 5.5-1.5M2.5 11.5c2-1 4-1.5 5.5-1.5s3.5.5 5.5 1.5"/></svg>,
  ticket:   <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="8" r="7"/><path d="M8 4v4l3 3"/></svg>,
  wrench:   <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M11.5 2.5a4 4 0 00-5.4 5.4L2 12l2 2 4.1-4.1A4 4 0 0011.5 2.5z"/></svg>,
  asset:    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="2" y="3" width="12" height="9" rx="1"/><path d="M5 12v2M11 12v2M3 14h10"/></svg>,
};

/* ── Role helpers ─────────────────────────────────────────── */
function getRole(role) {
  const r = (role || '').toLowerCase();
  if (['owner','admin','systemadmin','manager'].includes(r)) return 'admin';
  if (r === 'technician') return 'technician';
  return 'user';
}

/* ── FAQ data per role ────────────────────────────────────── */
const FAQS = {
  admin: [
    { q: 'How do I reset a user\'s password?',
      a: 'Go to Users → select the user → click "Reset Password". The system sends a temporary password to their email, and they are prompted to change it on their next login.' },
    { q: 'Why is my asset status showing as "Under Maintenance"?',
      a: 'An asset automatically moves to "Under Maintenance" the moment a maintenance ticket is raised. The status reverts to "Assigned" or "Available" when the technician closes the ticket.' },
    { q: 'Can I export reports to PDF or CSV?',
      a: 'Yes. Navigate to any report page (Maintenance Cost or Warranty Expiry) and use the export button in the top-right corner. Both PDF and CSV formats are supported.' },
    { q: 'How does the QR code label system work?',
      a: 'When you register an asset, the system auto-generates a unique QR code. You can print this label from the asset\'s detail page and attach it physically. Scanning the code opens the asset\'s full profile instantly.' },
    { q: 'What happens when I retire an asset?',
      a: 'Retiring an asset performs a soft-delete — it is flagged as "Retired" and hidden from active views, but all its maintenance logs, assignment history, and cost data are preserved permanently for audit purposes.' },
    { q: 'How do I upgrade or downgrade my subscription plan?',
      a: 'Go to Organisation → Settings → Billing & Plans. Click "Change Plan" to view all available tiers. Upgrades apply immediately; downgrades take effect at the next billing cycle.' },
    { q: 'Can a user belong to multiple departments?',
      a: 'Yes. Go to Users → edit a user → assign them to multiple departments. This is common for managers who oversee more than one team.' },
    { q: 'What roles are available and what can each do?',
      a: 'Fluxion has four roles: Owner (full access + billing), Admin (full org management), Technician (ticket management + own performance data), and User (own assets + raise tickets). Roles are assigned when inviting a user and can be changed under Users → Roles & Access.' },
  ],
  technician: [
    { q: 'How do I see tickets assigned to me?',
      a: 'Go to Technician → My Tickets. You\'ll see all tickets currently assigned to you, filterable by status and priority.' },
    { q: 'How do I update the status of a ticket?',
      a: 'Open the ticket from My Tickets, then click "Update Status". You can move a ticket to In Progress, Waiting Parts, Resolved, or Closed. The reporter receives an automatic email on every status change.' },
    { q: 'What does "Waiting Parts" status mean?',
      a: '"Waiting Parts" signals that repair is blocked while you wait for external components. This status is excluded from your average resolution time calculation so it doesn\'t penalise your performance metrics.' },
    { q: 'How do I log a repair?',
      a: 'From the ticket detail page, click "Log Repair". Enter the labour cost, any external parts cost, and your repair notes. This creates an immutable maintenance log that can never be edited or deleted.' },
    { q: 'What does my Performance page show?',
      a: 'It shows: total tickets resolved all-time, tickets resolved this calendar month, your average resolution time in hours, and your total repair cost contributed.' },
    { q: 'Can I add comments visible to the reporter?',
      a: 'Yes. When adding a log or comment on a ticket, toggle "Visible to reporter" to on. The reporter can then see your update from their ticket view.' },
    { q: 'What is the difference between Resolved and Closed?',
      a: '"Resolved" means the work is done and the reporter has been notified. "Closed" is the final state after confirmation. Either status counts as completed for your performance metrics.' },
  ],
  user: [
    { q: 'Where can I see all assets assigned to me?',
      a: 'Go to Assets → Assigned Assets. This shows every physical item currently assigned to you, including status, type, and serial number.' },
    { q: 'How do I raise a maintenance ticket?',
      a: 'Go to Maintenance → Raise Ticket. Select the asset with the issue, write a clear title and description, choose the priority level, and submit. A technician will be assigned.' },
    { q: 'How do I track the progress of my ticket?',
      a: 'Go to Maintenance → All Tickets and find your ticket. You\'ll see the current status. You\'ll also receive automatic email updates whenever the status changes — no need to keep checking manually.' },
    { q: 'What does "Under Maintenance" asset status mean?',
      a: 'This means a maintenance ticket has been opened for that asset. Your admin and technician are aware of the issue and it is being handled.' },
    { q: 'Can I add more details after submitting a ticket?',
      a: 'Currently you cannot edit a submitted ticket, but the technician assigned to it may add comments you can see in the ticket\'s history. Contact your admin if you need to update critical information.' },
    { q: 'What should I do if an asset I use doesn\'t appear in my list?',
      a: 'It may not have been formally assigned to you yet. Contact your administrator and ask them to create the assignment in the Assets → Asset Assignments section.' },
    { q: 'Will I be notified when my ticket is resolved?',
      a: 'Yes. Every time a technician changes the status of your ticket (In Progress, Resolved, Closed), you will receive an automatic email. You can also check the status anytime in the Tickets page.' },
  ],
};

/* ── Quick cards per role ─────────────────────────────────── */
const QUICK_CARDS = {
  admin: [
    { icon: IC.book,   bg: 'rgba(59,130,246,.12)',   color: 'rgba(100,165,255,.9)', title: 'Getting Started Guide', sub: 'Step-by-step setup for departments, assets, and your team.',   to: '/welcome'   },
    { icon: IC.docs,   bg: 'rgba(34,197,94,.12)',    color: 'rgba(80,210,130,.9)',  title: 'Billing & Subscription', sub: 'Manage your plan, user seats, and asset limits.',               to: '/settings' },
    { icon: IC.mail,   bg: 'rgba(245,158,11,.12)',   color: 'rgba(245,180,80,.9)',  title: 'Email Support',         sub: 'Our support team responds within 24 hours on business days.',    href: 'mailto:support@fluxion.app' },
    { icon: IC.chat,   bg: 'rgba(139,92,246,.12)',   color: 'rgba(180,140,255,.9)', title: 'Live Chat',             sub: 'Available Mon–Fri, 9am–6pm UTC. Average response under 5 min.',  comingSoon: true },
  ],
  technician: [
    { icon: IC.ticket, bg: 'rgba(59,130,246,.12)',   color: 'rgba(100,165,255,.9)', title: 'My Ticket Queue',       sub: 'View and manage all tickets currently assigned to you.',          to: '/technician/tickets' },
    { icon: IC.wrench, bg: 'rgba(34,197,94,.12)',    color: 'rgba(80,210,130,.9)',  title: 'Log a Repair',          sub: 'Log repair details, labour cost, and notes for a ticket.',         to: '/technician/tickets' },
    { icon: IC.mail,   bg: 'rgba(245,158,11,.12)',   color: 'rgba(245,180,80,.9)',  title: 'Email Support',         sub: 'Contact our team for help with the Fluxion technician portal.',    href: 'mailto:support@fluxion.app' },
    { icon: IC.chat,   bg: 'rgba(139,92,246,.12)',   color: 'rgba(180,140,255,.9)', title: 'Live Chat',             sub: 'Available Mon–Fri, 9am–6pm UTC.',                                  comingSoon: true },
  ],
  user: [
    { icon: IC.asset,  bg: 'rgba(59,130,246,.12)',   color: 'rgba(100,165,255,.9)', title: 'My Assigned Assets',    sub: 'View all physical equipment currently assigned to you.',           to: '/assigned-assets' },
    { icon: IC.ticket, bg: 'rgba(34,197,94,.12)',    color: 'rgba(80,210,130,.9)',  title: 'Raise a Ticket',        sub: 'Report equipment issues and have a technician assigned to you.',   to: '/raise-ticket' },
    { icon: IC.mail,   bg: 'rgba(245,158,11,.12)',   color: 'rgba(245,180,80,.9)',  title: 'Email Your Admin',      sub: 'For account changes, asset issues, or org-level queries.',         href: 'mailto:support@fluxion.app' },
    { icon: IC.chat,   bg: 'rgba(139,92,246,.12)',   color: 'rgba(180,140,255,.9)', title: 'Ticket Status Help',    sub: 'Not sure what a status means? Check the FAQ below.',               anchor: 'sp-faq' },
  ],
};

/* ── Keyboard shortcuts per role ──────────────────────────── */
const SHORTCUTS = {
  admin: [
    { action: 'Global search',   keys: ['Ctrl', 'K'] },
    { action: 'New asset',       keys: ['N', 'A'] },
    { action: 'New ticket',      keys: ['N', 'T'] },
    { action: 'Invite user',     keys: ['N', 'U'] },
    { action: 'Go to dashboard', keys: ['G', 'D'] },
    { action: 'Go to assets',    keys: ['G', 'A'] },
    { action: 'Go to tickets',   keys: ['G', 'T'] },
    { action: 'Go to users',     keys: ['G', 'U'] },
    { action: 'Toggle sidebar',  keys: ['Ctrl', '\\'] },
    { action: 'Help & support',  keys: ['?'] },
  ],
  technician: [
    { action: 'Global search',    keys: ['Ctrl', 'K'] },
    { action: 'New ticket',       keys: ['N', 'T'] },
    { action: 'Go to dashboard',  keys: ['G', 'D'] },
    { action: 'Go to my tickets', keys: ['G', 'T'] },
    { action: 'Toggle sidebar',   keys: ['Ctrl', '\\'] },
    { action: 'Help & support',   keys: ['?'] },
  ],
  user: [
    { action: 'Global search',        keys: ['Ctrl', 'K'] },
    { action: 'New ticket',           keys: ['N', 'T'] },
    { action: 'Go to tickets',        keys: ['G', 'T'] },
    { action: 'Go to assigned assets',keys: ['G', 'A'] },
    { action: 'Toggle sidebar',       keys: ['Ctrl', '\\'] },
    { action: 'Help & support',       keys: ['?'] },
  ],
};

/* ── Title / description per role ─────────────────────────── */
const HERO = {
  admin: {
    eyebrow: 'Administrator Help Centre',
    title: 'Support & Documentation',
    sub: 'Everything you need to manage your organisation, troubleshoot issues, and contact our team.',
  },
  technician: {
    eyebrow: 'Technician Help Centre',
    title: 'Support & How-To Guides',
    sub: 'Find answers about ticket management, repair logging, performance metrics, and more.',
  },
  user: {
    eyebrow: 'User Help Centre',
    title: 'Help & Support',
    sub: 'Get help with your assigned assets, maintenance tickets, and tracking your requests.',
  },
};

/* ████████████████████████████████████████████████████████ */
export default function SupportPage() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const roleGroup   = getRole(user?.role);
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => setOpenFaq(prev => prev === idx ? null : idx);

  const faqs      = FAQS[roleGroup];
  const cards     = QUICK_CARDS[roleGroup];
  const shortcuts = SHORTCUTS[roleGroup];
  const hero      = HERO[roleGroup];

  const handleCard = (card) => {
    if (card.to)        { navigate(card.to); return; }
    if (card.href)      { window.location.href = card.href; return; }
    if (card.anchor)    {
      document.getElementById(card.anchor)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="page sp-page">

      {/* ── Header ── */}
      <div className="sp-header">
        <div className="sp-eyebrow">
          <span className="sp-eyebrow-line" />
          {hero.eyebrow}
        </div>
        <h1 className="sp-title">{hero.title}</h1>
        <p className="sp-sub">{hero.sub}</p>
      </div>

      {/* ── Quick action cards ── */}
      <div className="sp-quick-grid">
        {cards.map((card, i) => (
          <div
            key={i}
            className="sp-q-card"
            onClick={() => handleCard(card)}
            style={{ cursor: card.comingSoon ? 'default' : 'pointer' }}
          >
            <div className="sp-q-icon" style={{ background: card.bg, color: card.color }}>
              {card.icon}
            </div>
            <div className="sp-q-title">{card.title}</div>
            <div className="sp-q-sub">{card.sub}</div>
            <div className="sp-q-arrow" style={{ color: card.color }}>
              {IC.arrow} {card.comingSoon ? 'Coming soon' : card.href ? card.href.replace('mailto:','') : 'Open →'}
            </div>
          </div>
        ))}
      </div>

      {/* ── Two-column body ── */}
      <div className="sp-body" id="sp-faq">
        {/* FAQ */}
        <div className="sp-faq-panel">
          <div className="sp-faq-head">{IC.faq} Frequently Asked Questions</div>
          {faqs.map((faq, i) => (
            <div className="sp-faq-item" key={i}>
              <button
                className={`sp-faq-q${openFaq === i ? ' open' : ''}`}
                onClick={() => toggleFaq(i)}
              >
                {faq.q}
                <span className="sp-faq-chevron">{IC.chevron}</span>
              </button>
              {openFaq === i && <div className="sp-faq-a">{faq.a}</div>}
            </div>
          ))}
        </div>

        {/* Right column */}
        <div className="sp-right">

          {/* System status */}
          <div className="sp-status-card">
            <div className="sp-status-row">
              <div className="sp-status-label">System Status</div>
              <div className="sp-status-badge">
                <span className="sp-status-dot" />
                All systems operational
              </div>
            </div>
            <div className="sp-status-services">
              {['API Services', 'Database', 'Asset Storage', 'Email Delivery', 'Auth Provider'].map(svc => (
                <div className="sp-svc-row" key={svc}>
                  <span className="sp-svc-name">{svc}</span>
                  <span className="sp-svc-ok">Operational</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="sp-contact-card">
            <div className="sp-contact-title">{IC.mail} Contact &amp; Resources</div>
            <div className="sp-contact-item">
              <div className="sp-ci-icon">{IC.mail}</div>
              <div>
                <div className="sp-ci-label">Email</div>
                <div className="sp-ci-val"><a href="mailto:support@fluxion.app">support@fluxion.app</a></div>
              </div>
            </div>
            <div className="sp-contact-item">
              <div className="sp-ci-icon">{IC.globe}</div>
              <div>
                <div className="sp-ci-label">Documentation</div>
                <div className="sp-ci-val"><a href="https://docs.fluxion.app" target="_blank" rel="noreferrer">docs.fluxion.app</a></div>
              </div>
            </div>
            <div className="sp-contact-item">
              <div className="sp-ci-icon">{IC.phone}</div>
              <div>
                <div className="sp-ci-label">Support Hours</div>
                <div className="sp-ci-val">Mon–Fri, 9am–6pm UTC</div>
              </div>
            </div>
          </div>

          {/* Keyboard shortcuts */}
          <div className="sp-shortcuts-card">
            <div className="sp-shortcuts-head">{IC.keyboard} Your Keyboard Shortcuts</div>
            <div className="sp-shortcuts-list">
              {shortcuts.map((s, i) => (
                <div className="sp-sc-row" key={i}>
                  <span>{s.action}</span>
                  <div className="sp-sc-keys">
                    {s.keys.map((k, j) => <span className="sp-sc-key" key={j}>{k}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
