// src/pages/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase-config';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';

const AdminDashboard = () => {
  const [adminEmail, setAdminEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAdminEmail(user.email);
      } else {
        navigate('/auth');
      }
    });
    return unsubscribe;
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>
      <p>Welcome, {adminEmail}</p>
      <button className="btn" onClick={() => navigate('/admin/queue-controls')}>Manage Queues</button>
      <button className="btn" onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default AdminDashboard;
