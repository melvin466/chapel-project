import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  const normalizedPath = path.replace(/\\/g, '/');
  const uploadPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  return `${api.defaults.baseURL.replace(/\/api\/?$/, '')}${encodeURI(uploadPath)}`;
};

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    bio: '',
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
      bio: user?.bio || '',
    });
    setPreviewUrl(getMediaUrl(user?.profilePicture));
  }, [user]);

  useEffect(() => {
    if (!profilePicture) return undefined;
    const objectUrl = URL.createObjectURL(profilePicture);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profilePicture]);

  const initials = useMemo(() => {
    const first = user?.firstName?.[0] || '';
    const last = user?.lastName?.[0] || '';
    return `${first}${last}` || 'ME';
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => payload.append(key, value ?? ''));
    if (profilePicture) payload.append('profilePicture', profilePicture);

    const response = await updateProfile(payload);
    if (response.success) {
      setProfilePicture(null);
      setMessage('Profile updated successfully.');
    } else {
      setError(response.message || 'Failed to update profile.');
    }
    setSaving(false);
  };

  return (
    <div className="container profile-page-shell">
      <h1 className="page-title">My Profile</h1>

      <div className="profile-hero-card">
        <div className="profile-photo-wrap">
          <div className="profile-photo">
            {previewUrl ? <img src={previewUrl} alt="Profile" /> : <span>{initials}</span>}
          </div>
          <label className="profile-upload-btn">
            Change Photo
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfilePicture(e.target.files[0] || null)}
            />
          </label>
        </div>

        <div className="profile-summary">
          <span className="profile-role">{user?.role || 'member'}</span>
          <h2>{user?.firstName} {user?.lastName}</h2>
          <p>{user?.email}</p>
          <div className="profile-mini-grid">
            <div>
              <strong>Phone</strong>
              <span>{user?.phoneNumber || 'Not added'}</span>
            </div>
            <div>
              <strong>Status</strong>
              <span>{user?.isEmailVerified ? 'Verified' : 'Active'}</span>
            </div>
          </div>
        </div>
      </div>

      <form className="profile-edit-card" onSubmit={handleSubmit}>
        <div className="profile-form-header">
          <div>
            <span className="profile-role">Profile details</span>
            <h2>Keep your chapel profile current</h2>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="profile-form-grid">
          <label>
            First name
            <input name="firstName" value={formData.firstName} onChange={handleChange} required />
          </label>
          <label>
            Last name
            <input name="lastName" value={formData.lastName} onChange={handleChange} required />
          </label>
          <label>
            Phone number
            <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
          </label>
          <label>
            Email
            <input value={user?.email || ''} disabled />
          </label>
        </div>

        <label className="profile-bio-field">
          Bio
          <textarea
            name="bio"
            rows="5"
            placeholder="Share a short note about yourself..."
            value={formData.bio}
            onChange={handleChange}
          />
        </label>
      </form>
    </div>
  );
};

export default ProfilePage;
