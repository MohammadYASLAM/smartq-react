// src/pages/JoinQueue.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebase-config';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

const JoinQueue = () => {
  //State variables to hold queue details and form info
  const [queueName, setQueueName] = useState('');
  const [queueCount, setQueueCount] = useState(0);
  const [estWaitTime, setEstWaitTime] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [joinInfo, setJoinInfo] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [queueData, setQueueData] = useState(null);

  //Hooks to read the current URL and change pages
  const location = useLocation(); // Gives access to URL and its search string
  const navigate = useNavigate(); // Allows programmatic page navigation

  //Parse the queueId from the URL’s query parameters
  const searchParams = new URLSearchParams(location.search);
  const queueId = searchParams.get('queueId');

  // Define the average service time per user (in minutes)
  const averageServiceTime = 5;


  //useEffect for initial load and real‑time updates
  useEffect(() => {
    // If no queueId is provided, immediately redirect.
    if (!queueId) {
      navigate('/invalid-queue');
      return;
    }

    // Listen in real-time for changes in the queue document.
    const queueRef = doc(db, "queues", queueId);
    const unsubscribe = onSnapshot(queueRef, (queueSnap) => {
      // If document doesn't exist, redirect.
      if (!queueSnap.exists()) {
        navigate('/invalid-queue');
        return;
      }
      const data = queueSnap.data(); // Get the latest queue data
      
      // If the queue is paused, redirect to the QueuePaused page.
      if (data.status !== "active") {
        navigate('/queue-paused');
        return;
      }
      
      // Update state with the latest data.
      setQueueData(data);
      setQueueName(data.name || 'Queue');
      const count = data.users ? data.users.length : 0;
      setQueueCount(count);
      // Calculate wait time
      setEstWaitTime(count * averageServiceTime);
      setLoading(false); // Data has loaded
    }, (error) => {
      //Handle any errors during listening
      console.error("Error listening to queue:", error);
      setErrorMsg("Error loading queue details.");
      setLoading(false);
    });

    // Clean up the listener on component unmount.
    return () => unsubscribe();
  }, [queueId, navigate, averageServiceTime]);


  //Function to handle the form submission when a user joins
  const handleJoin = async (e) => {
    e.preventDefault();  // Prevent page reload
    const { name, email } = joinInfo;  // Get name & email from state
    if (!name || !email) return;     // Do nothing if fields are empty
    const userId = email; // Using email as a unique identifier

    // make sure the queue is still active at join time.
    if (queueData && queueData.status !== "active") {
      navigate('/queue-paused');
      return;
    }
    // Prevent duplicate joining.
    if (queueData && queueData.users && queueData.users.find(u => u.userId === userId)) {
      alert("You are already in the queue.");
      navigate(`/queue-status?queueId=${queueId}&userId=${encodeURIComponent(userId)}`);
      return;
    }

    // Calculate new position based on the latest user count.
    const newPosition = (queueData.users && queueData.users.length) || 0;
    const newUser = { userId, name, email, position: newPosition };

    try {
      const queueRef = doc(db, "queues", queueId);
      // Add the new user to the queue.
      await updateDoc(queueRef, {
        users: arrayUnion(newUser)
      });
      navigate(`/queue-status?queueId=${queueId}&userId=${encodeURIComponent(userId)}`);
    } catch (error) {
      console.error("Error joining queue:", error);
      setErrorMsg("Error joining queue. Please try again later.");
    }
  };

  // Show loading text while queue details are being fetched
  if (loading) return <p>Loading queue details...</p>;


  // Render the join-queue form and queue details
  return (
    <div
      className="queue-status"
      style={{ maxWidth: '400px', margin: '0 auto', padding: '1rem', textAlign: 'center' }}
    >
      <h2>{queueName} - Join the Queue</h2>
      <p>Current number in queue: {queueCount}</p>
      <p>Estimated wait time: {estWaitTime} minutes</p>
      {/* Show any error messages */}
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
        <button
          type="submit"
          className="btn"
          style={{ padding: '0.75rem', fontSize: '16px' }}
        >
          Join Queue
        </button>
      </form>
    </div>
  );
};

export default JoinQueue;
