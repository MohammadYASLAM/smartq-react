// src/pages/QueueStatus.js
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebase-config';
import { doc, onSnapshot, updateDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

const QueueStatus = () => {
  //State variables for the user’s queue information
  const [position, setPosition] = useState('--');
  const [estWaitTime, setEstWaitTime] = useState('--');
  const [welcomeMessage, setWelcomeMessage] = useState("Loading...");
  //Message to greet user, then show their name/email
  const [notified, setNotified] = useState(false);
  const [isBeingServed, setIsBeingServed] = useState(false);
  //Tracks if the user’s position is 0 (being served)
  const [searchParams] = useSearchParams();
  //Read queueId and userId from the URL query parameters
  const queueId = searchParams.get('queueId');
  const userId = searchParams.get('userId');
  const navigate = useNavigate();

  // Average service time in minutes per user
  const averageServiceTime = 5;


  //useEffect: runs when component mounts or when dependencies change
  useEffect(() => {
    // If userId is missing, send them back to join-queue page
    if (!userId) {
      navigate(`/join-queue?queueId=${queueId}`);
      return;
    }
    // Reference the specific queue document in Firestore
    const queueRef = doc(db, "queues", queueId);
    //Listen in real time for updates to this queue document
    const unsubscribe = onSnapshot(queueRef, (docSnap) => {
      //If the queue no longer exists, alert and redirect to InvalidQueue
      if (!docSnap.exists()) {
        alert("Queue has been removed.");
        navigate('/invalid-queue');
        return;
      }

      // Extract the document data
      const data = docSnap.data();
      // Update current user info from queue
      const currentUser = data.users ? data.users.find(u => u.userId === userId) : null;
      if (currentUser) {
        //Update welcome message with the user’s name and email
        setWelcomeMessage(`Welcome ${currentUser.name} (${currentUser.email})`);
        //Update the user’s position in state
        setPosition(currentUser.position);
        // Calculate estimated wait time based on the user's position
        setEstWaitTime(currentUser.position * averageServiceTime);
        //If the user’s position is 0, they are being served
        if (currentUser.position === 0) {
          setIsBeingServed(true);
          //Show alert only once when they first reach position 0
          if (!notified) {
            setNotified(true);
            alert("It's your turn now!");
          }
        } else { //If position > 0, they are waiting
          setIsBeingServed(false);
        }
      } else if (isBeingServed) {
        //If the user was being served but no longer in the list, send to farewell (thank you)
        navigate('/farewell');
      }
    });

    //Clean up the Firestore listener when the component unmounts
    return () => unsubscribe();
  }, [queueId, userId, navigate, notified, isBeingServed, averageServiceTime]);


  // Handler for “Leave Queue” button
  const leaveQueue = async () => {
    //Reference the queue document and fetch it once
    const queueRef = doc(db, "queues", queueId);
    const queueSnap = await getDoc(queueRef);
    if (!queueSnap.exists()) return;
    // Get current users list, filter out this user
    const data = queueSnap.data();
    let updatedUsers = data.users.filter(u => u.userId !== userId);
    // Reassign positions after the user leaves or  Reassign positions in order (0, 1, 2, …)
    updatedUsers = updatedUsers.map((u, index) => ({ ...u, position: index }));
    //Save the updated array back to Firestore
    await updateDoc(queueRef, { users: updatedUsers });
    //Notify the user and redirect appropriately
    alert("You have left the queue.");
    navigate(isBeingServed ? '/farewell' : `/join-queue?queueId=${queueId}`);
  };

  //Render the UI
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
