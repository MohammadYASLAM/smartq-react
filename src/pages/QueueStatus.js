// src/pages/QueueStatus.js
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebase-config';
import { doc, onSnapshot, updateDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

const QueueStatus = () => {
  const [position, setPosition] = useState('--');
  const [estWaitTime, setEstWaitTime] = useState('--');
  const [welcomeMessage, setWelcomeMessage] = useState("Loading...");
  const [notified, setNotified] = useState(false);
  const [isBeingServed, setIsBeingServed] = useState(false);
  const [searchParams] = useSearchParams();
  const queueId = searchParams.get('queueId');
  const userId = searchParams.get('userId');
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      navigate(`/join-queue?queueId=${queueId}`);
      return;
    }
    const queueRef = doc(db, "queues", queueId);
    const unsubscribe = onSnapshot(queueRef, (docSnap) => {
      if (!docSnap.exists()) {
        alert("Queue has been removed.");
        navigate('/invalid-queue');
        return;
      }
      const data = docSnap.data();
      // Update current user info from queue
      const currentUser = data.users ? data.users.find(u => u.userId === userId) : null;
      if (currentUser) {
        setWelcomeMessage(`Welcome ${currentUser.name} (${currentUser.email})`);
        setPosition(currentUser.position);
        setEstWaitTime(data.estimatedWaitTime);
        if (currentUser.position === 0) {
          setIsBeingServed(true);
          if (!notified) {
            setNotified(true);
            alert("It's your turn now!");
          }
        } else {
          setIsBeingServed(false);
        }
      } else if (isBeingServed) {
        navigate('/farewell');
      }
    });
    return () => unsubscribe();
  }, [queueId, userId, navigate, notified, isBeingServed]);

  const leaveQueue = async () => {
    const queueRef = doc(db, "queues", queueId);
    const queueSnap = await getDoc(queueRef);
    if (!queueSnap.exists()) return;
    const data = queueSnap.data();
    let updatedUsers = data.users.filter(u => u.userId !== userId);
    updatedUsers = updatedUsers.map((u, index) => ({ ...u, position: index }));
    await updateDoc(queueRef, { users: updatedUsers });
    alert("You have left the queue.");
    navigate(isBeingServed ? '/farewell' : `/join-queue?queueId=${queueId}`);
  };

  return (
    <div className="queue-status">
      <div id="welcomeMessage">{welcomeMessage}</div>
      <h2>Queue Status</h2>
      <div className="position-display">
        <h2>{isBeingServed ? "It's your turn!" : "Your Position"}</h2>
        <div className="position-number">{position}</div>
      </div>
      <p>Estimated wait time: {estWaitTime} minutes</p>
      <button id="leaveQueueBtn" className="btn" onClick={leaveQueue}>Leave Queue</button>
    </div>
  );
};

export default QueueStatus;
