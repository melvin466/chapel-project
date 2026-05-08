import React, { useState, useEffect } from 'react';
import settingService from '../services/settingService';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'St. Francis Chapel',
    siteDescription: 'Welcome to St. Francis Chapel - A place of worship and fellowship',
    contactEmail: 'chapel@mak.ac.ug',
    contactPhone: '+256 700 000000',
    address: 'Makerere University, Kampala, Uganda',
    serviceTimes: {
      sunday: '9:00 AM',
      wednesday: '5:30 PM',
      friday: '4:00 PM'
    },
    socialMedia: {
      facebook: 'https://facebook.com/stfrancischapel',
      twitter: 'https://twitter.com/stfrancischapel',
      instagram: 'https://instagram.com/stfrancischapel'
    },
    emailNotifications: true,
    allowRegistration: true,
    maintenanceMode: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingService.getSettings();
      if (response.data?.settings) {
        setSettings(prev => ({ ...prev, ...response.data.settings }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleNestedChange = (category, field, value) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [field]: value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingService.updateSettings(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all settings to default?')) {
      window.location.reload();
    }
  };

  if (loading) return <div className="loading">Loading settings...</div>;

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>System Settings</h1>
        <div className="settings-actions">
          <button onClick={handleReset} className="btn-secondary">Reset to Default</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="settings-tabs">
        <button className={activeTab === 'general' ? 'active' : ''} onClick={() => setActiveTab('general')}>
          General
        </button>
        <button className={activeTab === 'contact' ? 'active' : ''} onClick={() => setActiveTab('contact')}>
          Contact & Location
        </button>
        <button className={activeTab === 'services' ? 'active' : ''} onClick={() => setActiveTab('services')}>
          Service Times
        </button>
        <button className={activeTab === 'social' ? 'active' : ''} onClick={() => setActiveTab('social')}>
          Social Media
        </button>
        <button className={activeTab === 'advanced' ? 'active' : ''} onClick={() => setActiveTab('advanced')}>
          Advanced
        </button>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        {activeTab === 'general' && (
          <div className="settings-panel">
            <h2>General Settings</h2>
            <div className="form-group">
              <label>Site Name</label>
              <input type="text" name="siteName" value={settings.siteName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Site Description</label>
              <textarea name="siteDescription" value={settings.siteDescription} onChange={handleChange} rows="3" />
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="settings-panel">
            <h2>Contact Information</h2>
            <div className="form-group">
              <label>Contact Email</label>
              <input type="email" name="contactEmail" value={settings.contactEmail} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Contact Phone</label>
              <input type="text" name="contactPhone" value={settings.contactPhone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea name="address" value={settings.address} onChange={handleChange} rows="2" />
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="settings-panel">
            <h2>Service Times</h2>
            <div className="form-group">
              <label>Sunday Service</label>
              <input 
                type="text" 
                value={settings.serviceTimes?.sunday || ''} 
                onChange={(e) => handleNestedChange('serviceTimes', 'sunday', e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Wednesday Service</label>
              <input 
                type="text" 
                value={settings.serviceTimes?.wednesday || ''} 
                onChange={(e) => handleNestedChange('serviceTimes', 'wednesday', e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Friday Service</label>
              <input 
                type="text" 
                value={settings.serviceTimes?.friday || ''} 
                onChange={(e) => handleNestedChange('serviceTimes', 'friday', e.target.value)} 
              />
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="settings-panel">
            <h2>Social Media Links</h2>
            <div className="form-group">
              <label>Facebook</label>
              <input 
                type="url" 
                value={settings.socialMedia?.facebook || ''} 
                onChange={(e) => handleNestedChange('socialMedia', 'facebook', e.target.value)} 
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div className="form-group">
              <label>Twitter / X</label>
              <input 
                type="url" 
                value={settings.socialMedia?.twitter || ''} 
                onChange={(e) => handleNestedChange('socialMedia', 'twitter', e.target.value)} 
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
            <div className="form-group">
              <label>Instagram</label>
              <input 
                type="url" 
                value={settings.socialMedia?.instagram || ''} 
                onChange={(e) => handleNestedChange('socialMedia', 'instagram', e.target.value)} 
                placeholder="https://instagram.com/yourpage"
              />
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="settings-panel">
            <h2>Advanced Settings</h2>
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" name="emailNotifications" checked={settings.emailNotifications} onChange={handleChange} />
                Enable Email Notifications
              </label>
            </div>
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" name="allowRegistration" checked={settings.allowRegistration} onChange={handleChange} />
                Allow New User Registration
              </label>
            </div>
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" name="maintenanceMode" checked={settings.maintenanceMode} onChange={handleChange} />
                Maintenance Mode (Site will be inaccessible to non-admins)
              </label>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </form>

      <style>{`
        .settings-container { padding: 2rem; max-width: 1000px; margin: 0 auto; }
        .settings-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .settings-header h1 { color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .settings-actions { display: flex; gap: 1rem; }
        .settings-tabs { display: flex; gap: 0.5rem; margin-bottom: 2rem; flex-wrap: wrap; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 1rem; }
        .settings-tabs button { padding: 0.8rem 1.5rem; background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: white; cursor: pointer; transition: all 0.3s; }
        .settings-tabs button:hover { background: rgba(255,255,255,0.2); }
        .settings-tabs button.active { background: #4CAF50; color: white; }
        .settings-panel { background: rgba(255,255,255,0.95); padding: 2rem; border-radius: 12px; }
        .settings-panel h2 { color: #333; margin-bottom: 1.5rem; border-bottom: 2px solid #4CAF50; padding-bottom: 0.5rem; }
        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; color: #333; font-weight: 500; }
        .form-group input, .form-group textarea { width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; }
        .form-group.checkbox label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .form-actions { margin-top: 2rem; text-align: right; }
        .btn-secondary { background: #9e9e9e; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default AdminSettings;