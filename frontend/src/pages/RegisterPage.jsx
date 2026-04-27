import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', phoneNumber: '',
    isStudent: true, studentId: '', program: '', yearOfStudy: '', faculty: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const response = await register(formData);
    if (response.success) {
      navigate('/');
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
        <form onSubmit={handleSubmit}>
          <input type="text" name="firstName" placeholder="First Name" onChange={handleChange} required />
          <input type="text" name="lastName" placeholder="Last Name" onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
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
      </div>
    </div>
  );
};

export default RegisterPage;