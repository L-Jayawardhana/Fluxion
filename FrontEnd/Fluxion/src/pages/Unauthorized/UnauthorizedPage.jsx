import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || 'user';

  const homeRoutes = {
    owner: '/dashboard', admin: '/dashboard', manager: '/dashboard',
    technician: '/technician/dashboard',
    user: '/assigned-assets',
  };
  const home = homeRoutes[role] || '/welcome';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0D0D0D', gap: '16px', fontFamily: 'Poppins, sans-serif',
      padding: '32px',
    }}>
      <div style={{ fontSize: '72px', fontWeight: 800, color: '#C84B2F', lineHeight: 1 }}>403</div>
      <div style={{ fontSize: '20px', fontWeight: 600, color: '#F2EFE8' }}>Access Restricted</div>
      <div style={{ fontSize: '14px', color: 'rgba(242,239,232,.45)', textAlign: 'center', maxWidth: '400px' }}>
        Your role <strong style={{ color: '#C84B2F', textTransform: 'capitalize' }}>{role}</strong> does not have
        permission to view this page. Contact your administrator if you believe this is an error.
      </div>
      <button
        onClick={() => navigate(home)}
        style={{
          marginTop: '8px', padding: '10px 28px',
          background: '#C84B2F', color: '#fff', border: 'none',
          borderRadius: '6px', cursor: 'pointer',
          fontFamily: 'Poppins, sans-serif', fontWeight: 600, fontSize: '13px',
        }}
      >
        Back to my dashboard
      </button>
    </div>
  );
}
