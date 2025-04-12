// src/pages/JoinQueue.js
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebase-config';
import { doc, getDoc, updateDoc, arrayUnion } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

const JoinQueue = () => {
  const [queueName, setQueueName] = useState('');
  const [queueCount, setQueueCount] = useState(0);
  const [estWaitTime, setEstWaitTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [joinInfo, setJoinInfo] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [queueData, setQueueData] = useState(null);
  const [searchParams] = useState(new URLSearchParams(window.location.search));
  const queueId = searchParams.get('queueId');
  const navigate = useNavigate();

  useEffect(() => {
    const loadQueueDetails = async () => {
      if (!queueId) {
        setErrorMsg("Invalid queue!");
        return;
      }
      const queueRef = doc(db, "queues", queueId);
      const queueSnap = await getDoc(queueRef);
      if (!queueSnap.exists()) {
        navigate('/invalid-queue');
        return;
      }
      const data = queueSnap.data();
      // Prevent joining if the queue is not active
      if (data.status !== "active") {
        alert("Sorry, queue has been paused. Try again later.");
        return;
      }
      setQueueData(data);
      setQueueName(data.name || 'Queue');
      setQueueCount(data.users ? data.users.length : 0);
      setEstWaitTime(data.estimatedWaitTime || 0);
      setLoading(false);
    };
    loadQueueDetails();
  }, [queueId, navigate]);

  const handleJoin = async (e) => {
    e.preventDefault();
    const { name, email } = joinInfo;
    if (!name || !email) return;
    const userId = email; // Using email as a unique identifier

    // If user is already in the queue, alert and redirect
    if (queueData && queueData.users && queueData.users.find(u => u.userId === userId)) {
      alert("You are already in the queue.");
      navigate(`/queue-status?queueId=${queueId}&userId=${encodeURIComponent(userId)}`);
      return;
    }
    // In case the queue gets paused after loading details
    if (queueData && queueData.status !== "active") {
      alert("Sorry, queue has been paused. Try again later.");
      return;
    }
    let newPosition = (queueData.users && queueData.users.length) || 0;
    const newUser = { userId, name, email, position: newPosition };

    const queueRef = doc(db, "queues", queueId);
    await updateDoc(queueRef, {
      users: arrayUnion(newUser)
    });
    navigate(`/queue-status?queueId=${queueId}&userId=${encodeURIComponent(userId)}`);
  };

  if (loading) return <p>Loading queue details...</p>;

  return (
    <div className="queue-status" style={{ maxWidth: '400px', margin: '0 auto', padding: '1rem' }}>
      <h2>{queueName} - Join the Queue</h2>
      <p>Current number in queue: {queueCount}</p>
      <p>Estimated wait time: {estWaitTime} minutes</p>
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Enter your name" 
          value={joinInfo.name}
          onChange={(e) => setJoinInfo({ ...joinInfo, name: e.target.value })}
          required
          style={{ padding: '0.5rem', fontSize: '16px' }}
        />
        <input 
          type="email" 
          placeholder="Enter your email" 
          value={joinInfo.email}
          onChange={(e) => setJoinInfo({ ...joinInfo, email: e.target.value })}
          required
          style={{ padding: '0.5rem', fontSize: '16px' }}
        />
        <button type="submit" className="btn" style={{ padding: '0.75rem', fontSize: '16px' }}>Join Queue</button>
      </form>
    </div>
  );
};

export default JoinQueue;
