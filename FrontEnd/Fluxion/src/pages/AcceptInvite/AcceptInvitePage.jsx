import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AcceptInvitePage.css';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('processing'); // checking, processing, error, success
  const processed = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    if (processed.current) return;
    processed.current = true;

    setStatus('processing');
    
    api.post('/User/accept-invite', { token })
      .then(() => {
        setStatus('success');
      })
      .catch((err) => {
        console.error(err);
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="accept-invite-container">
      <div className="accept-invite-card">
        {status === 'processing' && (
          <div className="processing-state">
            <div className="spinner"></div>
            <h2>Processing Invitation...</h2>
            <p>Please wait while we set up your account.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="success-state">
            <div className="icon-success">✓</div>
            <h2>Invitation Accepted!</h2>
            <p>Your employee account has been successfully activated.</p>
            <button className="primary-btn" onClick={() => navigate('/login')}>
              Proceed to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="error-state">
            <div className="icon-error">!</div>
            <h2>Invalid or Expired Invitation</h2>
            <p>We couldn't process this invitation. It may have already been used, or the link might be invalid.</p>
            <button className="secondary-btn" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
