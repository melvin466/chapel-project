import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import userService from '../services/userService';

const AdminUserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'member',
    isActive: true
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
        isActive: user.isActive
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await userService.updateUser(id, updateData);
        alert('User updated successfully!');
      } else {
        await userService.createUser(formData);
        alert('User created successfully!');
      }
      navigate('/admin/users');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container">
      <div className="admin-form-card">
        <h1>{isEditing ? 'Edit User' : 'Create New User'}</h1>
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
          
          <div className="form-row">
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="member">Member</option>
              <option value="chaplain">Chaplain</option>
              <option value="admin">Admin</option>
            </select>
            <label className="checkbox-label">
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
              Active Account
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
        .admin-form-container { min-height: 80vh; display: flex; justify-content: center; align-items: center; padding: 2rem; background: linear-gradient(135deg, #667eea, #764ba2); }
        .admin-form-card { background: white; border-radius: 24px; padding: 2rem; max-width: 600px; width: 100%; }
        .admin-form-card h1 { color: #333; margin-bottom: 1.5rem; }
        .admin-form-card input, .admin-form-card select { width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 8px; }
        .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .form-row input, .form-row select { flex: 1; }
        .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem; }
        .btn-primary { background: #4CAF50; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
        .btn-secondary { background: #9e9e9e; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default AdminUserForm;