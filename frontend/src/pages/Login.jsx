import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import EpiqLogo from '../components/EpiqLogo';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (localStorage.getItem('auth') === 'true') {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'Santhosh' && password === 'welcome') {
      localStorage.setItem('auth', 'true');
      toast.success('Welcome back, Santhosh!');
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else {
      toast.error('Invalid username or password');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg)', flexDirection: 'column' }}>
      <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
        <EpiqLogo size={48} />
        <h1 style={{ color: 'white', margin: 0, fontSize: 32, letterSpacing: '1px' }}>EPIQ INDIA</h1>
      </div>
      
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ margin: 0, fontSize: 24 }}>Sign In</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 15 }}>Enter your credentials to access the CRM</p>
        </div>
        
        <form onSubmit={handleLogin} className="form-grid">
          <div className="form-group form-full">
            <label>Username</label>
            <input 
              type="text"
              className="form-control" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              autoFocus
              placeholder="e.g. Santhosh"
            />
          </div>
          <div className="form-group form-full">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="•••••••"
            />
          </div>
          <div className="form-full" style={{ marginTop: 24 }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 24px', fontSize: 16 }}>
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
