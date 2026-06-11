import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      return;
    }

    const verify = async () => {
      const response = await verifyEmail(token);
      if (response.success) {
        setStatus('success');
        setMessage(response.message || 'Email verified successfully.');
        window.setTimeout(() => {
          navigate(['admin', 'chaplain'].includes(response.user?.role) ? '/admin' : '/dashboard', { replace: true });
        }, 1000);
      } else {
        setStatus('error');
        setMessage(response.message || 'Could not verify this email link.');
      }
    };

    verify();
  }, [navigate, searchParams, verifyEmail]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Email Verification</h2>
        <div className={status === 'error' ? 'error' : 'success-message'}>{message}</div>
        {status === 'error' && <p><Link to="/login">Back to login</Link></p>}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
