import React, { useState, useEffect } from 'react';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const { user: currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'member',
    isActive: true,
    isEmailVerified: false
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      setUsers(response.data?.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
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
    try {
      if (editingUser) {
        await userService.updateUser(editingUser._id, formData);
        alert('User updated successfully!');
      } else {
        await userService.createUser(formData);
        alert('User created successfully!');
      }
      setShowForm(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save user');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: 'member',
      isActive: true,
      isEmailVerified: false
    });
  };

  const handleDelete = async (id) => {
    if (id === currentUser?._id) {
      alert('You cannot delete your own account');
      return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(id);
        alert('User deleted successfully!');
        loadUsers();
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified || false
    });
    setShowForm(true);
  };

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      await userService.updateUser(id, { isActive: !currentStatus });
      loadUsers();
    } catch (error) {
      alert('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Users</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingUser(null); resetForm(); }} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add New User'}
        </button>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="role-filter">
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="chaplain">Chaplain</option>
          <option value="member">Member</option>
          <option value="student_leader">Student Leader</option>
        </select>
      </div>

      {showForm && (
        <div className="admin-form">
          <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required />
              <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required />
            </div>
            
            <div className="form-row">
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
              <input type="tel" name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} required />
            </div>
            
            <div className="form-row">
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="member">Member</option>
                <option value="chaplain">Chaplain</option>
                <option value="admin">Admin</option>
                <option value="student_leader">Student Leader</option>
              </select>
            </div>
            
            <div className="form-row">
              <label className="checkbox-label">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
                Active Account
              </label>
              <label className="checkbox-label">
                <input type="checkbox" name="isEmailVerified" checked={formData.isEmailVerified} onChange={handleChange} />
                Email Verified
              </label>
            </div>
            
            <button type="submit" className="btn-primary">{editingUser ? 'Update User' : 'Create User'}</button>
          </form>
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center' }}>No users found</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.phoneNumber}</td>
                  <td><span className={`role-badge role-${user.role}`}>{user.role}</span></td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <span className={`verify-badge ${user.isEmailVerified ? 'verified' : 'unverified'}`}>
                      {user.isEmailVerified ? '✓ Verified' : '✗ Unverified'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => handleEdit(user)} className="btn-edit">Edit</button>
                    <button onClick={() => toggleUserStatus(user._id, user.isActive)} className="btn-toggle">
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(user._id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .admin-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .admin-header h1 { color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .filters-bar { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .search-input { flex: 1; padding: 0.8rem; border: none; border-radius: 8px; background: rgba(255,255,255,0.9); }
        .role-filter { padding: 0.8rem; border: none; border-radius: 8px; background: rgba(255,255,255,0.9); }
        .admin-form { background: rgba(255,255,255,0.95); padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
        .admin-form form { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .form-row > * { flex: 1; min-width: 150px; }
        .admin-form input, .admin-form select { padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; }
        .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .admin-table-container { background: rgba(255,255,255,0.95); border-radius: 12px; overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
        .admin-table th { background: #4CAF50; color: white; }
        .admin-table tr:hover { background: #f5f5f5; }
        .role-badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; }
        .role-admin { background: #f44336; color: white; }
        .role-chaplain { background: #2196F3; color: white; }
        .role-member { background: #4CAF50; color: white; }
        .role-student_leader { background: #ff9800; color: white; }
        .status-badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; }
        .status-active { background: #4CAF50; color: white; }
        .status-inactive { background: #9e9e9e; color: white; }
        .verify-badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; }
        .verified { background: #4CAF50; color: white; }
        .unverified { background: #ff9800; color: white; }
        .btn-edit, .btn-toggle, .btn-delete { padding: 0.3rem 0.8rem; margin: 0 0.2rem; border: none; border-radius: 4px; cursor: pointer; }
        .btn-edit { background: #2196F3; color: white; }
        .btn-toggle { background: #ff9800; color: white; }
        .btn-delete { background: #f44336; color: white; }
      `}</style>
    </div>
  );
};

export default AdminUsers;