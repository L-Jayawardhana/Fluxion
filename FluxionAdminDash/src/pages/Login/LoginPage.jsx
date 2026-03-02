import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Placeholder — replace with real admin auth
        if (email && password) {
            navigate('/');
        } else {
            setError('Please enter your credentials.');
        }
    };

    return (
        <div className="auth-layout">
            <div className="auth-card">
                <div className="auth-logo">
                    <img src="/LOGOblack.png" alt="Fluxion" />
                    <h1>FLUXION</h1>
                </div>

                <h2>Admin Sign In</h2>
                <p className="auth-subtitle">Access the administration panel</p>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="admin@fluxion.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}
