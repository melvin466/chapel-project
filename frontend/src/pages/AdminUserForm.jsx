import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import userService from '../services/userService';

const AdminUserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'member',
    isActive: true,
    isEmailVerified: false,
    profilePicture: ''
  });

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      const response = await userService.getUserById(id);
      const user = response.data.user;
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        phoneNumber: user.phoneNumber,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified || false,
        profilePicture: user.profilePicture || ''
      });
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const buildPayload = () => {
    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'password' && !value) return;
      payload.append(key, value ?? '');
    });
    if (profilePicture) payload.append('profilePicture', profilePicture);
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEditing) {
        await userService.updateUser(id, buildPayload());
      } else {
        await userService.createUser(buildPayload());
      }
      navigate('/admin/users');
    } catch (error) {
      setError(error.response?.data?.message || `Failed to save user (${error.response?.status || 'network error'})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container">
      <div className="admin-form-card">
        <h1>{isEditing ? 'Edit User' : 'Create New User'}</h1>
        {error && <div className="form-message error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required />
            <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required />
          </div>
          
          <div className="form-row">
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
            <input type="tel" name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} required />
          </div>
          
          {!isEditing && (
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          )}

          <div className="media-upload-section">
            <label>
              Profile picture
              <input type="file" name="profilePicture" accept="image/*" onChange={(e) => setProfilePicture(e.target.files[0] || null)} />
            </label>
            {formData.profilePicture && <small>Current image: {formData.profilePicture}</small>}
          </div>
          
          <div className="form-row">
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="member">Member</option>
              <option value="chaplain">Chaplain</option>
              <option value="admin">Admin</option>
              <option value="chapel_leader">Chapel Leader</option>
            </select>
            <label className="checkbox-label">
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
              Active Account
            </label>
            <label className="checkbox-label">
              <input type="checkbox" name="isEmailVerified" checked={formData.isEmailVerified} onChange={handleChange} />
              Email Verified
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/admin/users')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .admin-form-container { min-height: 80vh; display: flex; justify-content: center; align-items: center; padding: 2rem; }
        .admin-form-card { background: rgba(255,255,255,0.96); border-radius: 8px; padding: 2rem; max-width: 600px; width: 100%; box-shadow: 0 18px 45px rgba(16,24,40,0.16); border: 1px solid rgba(255,255,255,0.55); }
        .admin-form-card h1 { color: #333; margin-bottom: 1.5rem; }
        .admin-form-card input, .admin-form-card select { width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 8px; }
        .media-upload-section { display: grid; gap: 0.5rem; margin-bottom: 1rem; }
        .media-upload-section label { display: flex; flex-direction: column; gap: 0.4rem; color: #333; font-weight: 500; }
        .media-upload-section small { color: #666; overflow-wrap: anywhere; }
        .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .form-row input, .form-row select { flex: 1; }
        .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem; }
        .btn-primary { background: #2f7d46; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
        .btn-secondary { background: #315f72; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default AdminUserForm;
