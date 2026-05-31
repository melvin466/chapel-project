import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', phoneNumber: '',
    isStudent: true, studentId: '', program: '', yearOfStudy: '', faculty: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    const response = await register(formData);
    if (response.success) {
      setVerificationPending(true);
      setMessage('Account created. Please check your email to verify your account.');
    } else {
      setError(response.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
        {error && <div className="error">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        {verificationPending ? (
          <p>After verifying your email, return to login.</p>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <input type="text" name="firstName" placeholder="First Name" onChange={handleChange} required />
              <input type="text" name="lastName" placeholder="Last Name" onChange={handleChange} required />
              <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input type="tel" name="phoneNumber" placeholder="Phone Number" onChange={handleChange} required />

              <label><input type="checkbox" name="isStudent" checked={formData.isStudent} onChange={(e) => setFormData({ ...formData, isStudent: e.target.checked })} /> I am a student</label>

              {formData.isStudent && (
                <>
                  <input type="text" name="studentId" placeholder="Student ID" onChange={handleChange} />
                  <input type="text" name="program" placeholder="Program" onChange={handleChange} />
                  <select name="yearOfStudy" onChange={handleChange}><option value="">Year</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select>
                  <input type="text" name="faculty" placeholder="Faculty" onChange={handleChange} />
                </>
              )}

              <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Registering...' : 'Register'}</button>
            </form>
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
