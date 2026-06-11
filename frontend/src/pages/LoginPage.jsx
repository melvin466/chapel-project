import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    const response = await login(email.trim().toLowerCase(), password);
    if (response.success) {
      navigate(['admin', 'chaplain'].includes(response.user?.role) ? '/admin' : '/', { replace: true });
    } else if (response.status === 403 || response.message?.toLowerCase().includes('verify your email')) {
      setVerificationPending(true);
      setMessage('Please check your email and tap the verification link before logging in.');
    } else {
      setError(response.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    setResending(true);
    try {
      const response = await authService.resendVerification(email.trim().toLowerCase());
      setMessage(response.message || 'If verification is needed, an email has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not resend verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        {error && <div className="error">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        {verificationPending ? (
          <>
            <button type="button" className="btn-primary" onClick={handleResend} disabled={resending || !email.trim()}>
              {resending ? 'Sending...' : 'Resend verification email'}
            </button>
            <p><button type="button" className="link-button" onClick={() => setVerificationPending(false)}>Back to login</button></p>
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={`password-toggle ${showPassword ? 'is-visible' : ''}`}
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="password-toggle-icon" aria-hidden="true" />
                </button>
              </div>
              <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Logging in...' : 'Login'}</button>
            </form>
            <p><Link to="/forgot-password">Forgot password?</Link></p>
            <p>Don't have an account? <Link to="/register">Register</Link></p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
