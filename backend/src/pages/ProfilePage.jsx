import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();
  
  return (
    <div className="container">
      <h1 className="page-title">My Profile</h1>
      <div className="profile-card">
        <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Phone:</strong> {user?.phoneNumber}</p>
        <p><strong>Role:</strong> {user?.role}</p>
      </div>
    </div>
  );
};

export default ProfilePage;