// src/pages/QueuePause.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const QueuePause = () => {
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '1rem', textAlign: 'center' }}>
      <h2>This queue is currently paused.</h2>
      <p>Please try again later.</p>
      <button
        onClick={() => navigate(-1)}
        className="btn"
        style={{ padding: '0.75rem', fontSize: '16px', marginTop: '1rem' }}
      >
        Try Agane
      </button>
    </div>
  );
};

export default QueuePause;
