import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import QueueControls from './pages/QueueControls';
import JoinQueue from './pages/JoinQueue';
import QueueStatus from './pages/QueueStatus';
import UserQueue from './pages/UserQueue';
import Farewell from './pages/Farewell';
import InvalidQueue from './pages/InvalidQueue';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/queue-controls" element={<QueueControls />} />
      <Route path="/join-queue" element={<JoinQueue />} />
      <Route path="/queue-status" element={<QueueStatus />} />
      <Route path="/user-queue" element={<UserQueue />} />
      <Route path="/farewell" element={<Farewell />} />
      <Route path="/invalid-queue" element={<InvalidQueue />} />
      {/* Fallback: redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
