// src/App.js

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Lazy‑load page components for faster initial load
const LandingPage    = lazy(() => import('./pages/LandingPage'));
const AuthPage       = lazy(() => import('./pages/AuthPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const QueueControls  = lazy(() => import('./pages/QueueControls'));
const JoinQueue      = lazy(() => import('./pages/JoinQueue'));
const QueueStatus    = lazy(() => import('./pages/QueueStatus'));
const Farewell       = lazy(() => import('./pages/Farewell'));
const InvalidQueue   = lazy(() => import('./pages/InvalidQueue'));
const QueuePause     = lazy(() => import('./pages/QueuePause'));

function App() {
  return (
    // Suspense shows a loading fallback while a lazy component is loading
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Authentication page for admins */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Admin-only pages */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/queue-controls" element={<QueueControls />} />

        {/* Customer-facing pages */}
        <Route path="/join-queue" element={<JoinQueue />} />
        <Route path="/queue-status" element={<QueueStatus />} />

        {/* Optionally pages */}
        <Route path="/farewell" element={<Farewell />} />
        <Route path="/invalid-queue" element={<InvalidQueue />} />
        <Route path="/queue-paused" element={<QueuePause />} />

        {/* Catch-all: redirect any unknown URL back to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default App;
