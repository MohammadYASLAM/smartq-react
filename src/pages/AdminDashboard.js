// src/pages/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebase-config';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';

//Define the AdminDashboard component
const AdminDashboard = () => {
  const [adminEmail, setAdminEmail] = useState('');
  const navigate = useNavigate();

  //useEffect: runs after the component first renders
  useEffect(() => {
    //Start listening for authentication status changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      //If a admin is logged in, store their email in state
      if (user) {
        setAdminEmail(user.email);
      } else {
        //if admin not send them to auth page
        navigate('/auth');
      }
    });
    return unsubscribe;
  }, [navigate]);


  //Handler for when the Logout button is clicked
  const handleLogout = async () => {
    await signOut(auth); //logout from firebase
    navigate('/auth'); //then send them back to auth page
  };

  //render admin dasboard
  return (
    <div className="container">
      <h1>Admin Dashboard</h1>
      <p>Welcome, {adminEmail}</p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn" onClick={() => navigate('/admin/queue-controls')}> 
          Manage Queues 
        </button>
        <button className="btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
