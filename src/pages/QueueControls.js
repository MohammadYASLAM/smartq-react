// src/pages/QueueControls.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase/firebase-config';
import { 
  collection, addDoc, deleteDoc, updateDoc, onSnapshot, doc, getDoc, query, where 
} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import QRCodeGenerator from '../components/QRCodeGenerator';

const QueueControls = () => {
  //Component state variables
  const [queues, setQueues] = useState([]);
  const [queueName, setQueueName] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState({}); // to track pending operations on a queue (pasue/next/delete)
  const navigate = useNavigate();   // For page navigation
  const queueCollection = collection(db, "queues");  // Reference to the "queues" collection in firestore


  //useEffect: runs once on mount to check auth & subscribe to queues
  useEffect(() => {

    //Listen for auth state changes (login/logout)
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        //If logged in, query this admin’s queues
        const q = query(queueCollection, where("adminId", "==", user.uid));
        //Subscribe to real-time updates on that query
        const unsubscribe = onSnapshot(q, (snapshot) => {
          // Map docs to JS objects with id + data fields
          const allQueues = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
          setQueues(allQueues);  // Update state with the latest queues
          setLoading(false);    // Data loaded, turn off loading indicator
        });
        return () => unsubscribe();  // Clean up Firestore listener on unmount
      } else {

        //if not login in? redirect to auth page
        navigate('/auth');
      }
    });
    //Clean up auth listener on unmount
    return unsubscribeAuth;
  }, [navigate, queueCollection]);


  //Function to create a new queue
  const createQueue = async (e) => {
    e.preventDefault();  // Prevent form from reloading the page
    if (!queueName.trim()) return;  // Do nothing if the name input is empty
    try {
      const user = auth.currentUser;  // Get current admin user

      //Build the new queue object
      const newQueue = {
        name: queueName,
        adminId: user.uid,
        status: "active",
        users: [],
        currentPosition: 1,
        estimatedWaitTime: 0,
        createdAt: new Date()
      };
      await addDoc(queueCollection, newQueue);  // Save to Firestore
      setQueueName('');                      // Clear the input box
    } catch (error) {
      console.error("Error creating queue:", error);
    }
  };

  //Toggle between active & paused for a given queue
  const toggleQueueStatus = async (queueId, currentStatus) => {
    // Mark action as pending (disable buttons)
    setActionPending(prev => ({ ...prev, [queueId]: true }));
    try {
      const queueDoc = doc(db, "queues", queueId);
      // Toggle status between "active" and "paused"
      await updateDoc(queueDoc, { status: currentStatus === "active" ? "paused" : "active" });
    } catch (error) {
      console.error(error);
    }
    // Clear pending flag
    setActionPending(prev => ({ ...prev, [queueId]: false }));
  };

  // Advance the queue to the next user
  const nextQueue = async (queueId) => {
    setActionPending(prev => ({ ...prev, [queueId]: true }));
    try {
      const queueDoc = doc(db, "queues", queueId);
      const queueSnap = await getDoc(queueDoc);
      if (!queueSnap.exists()) return;
      let users = queueSnap.data().users || [];
      // Remove the user with position 0 (currently being served)
      users = users.filter(u => u.position !== 0);
      // Reassign positions based on the sorted original order
      users.sort((a, b) => a.position - b.position);
      users = users.map((user, index) => ({ ...user, position: index }));
      await updateDoc(queueDoc, { users });  // Save updated user array
    } catch (error) {
      console.error(error);
    }
    setActionPending(prev => ({ ...prev, [queueId]: false }));
  };

  //Delete a queue entirely
  const deleteQueue = async (queueId) => {
    // Confirm with the admin before deleting
    if (!window.confirm("Are you sure you want to delete this queue? This action cannot be undone.")) return;
    setActionPending(prev => ({ ...prev, [queueId]: true }));
    try {
      await deleteDoc(doc(db, "queues", queueId));
    } catch (error) {
      console.error(error);
    }
    setActionPending(prev => ({ ...prev, [queueId]: false }));
  };

  // Render the UI
  return (
    <div className="container">
      <h1>Queue Management</h1>
      <button className="btn" onClick={() => navigate('/admin/dashboard')}>Back to Dashboard</button>
      <section style={{ marginBottom: '2rem' }}>
        <h2>Create a New Queue</h2>
        <form onSubmit={createQueue}>
          <input 
            type="text" 
            placeholder="Enter Queue Name" 
            value={queueName} 
            onChange={(e) => setQueueName(e.target.value)} 
            required 
            style={{ width: '100%', marginBottom: '0.5rem', padding: '0.5rem' }}
          />
          <button type="submit" className="btn">Create Queue</button>
        </form>
      </section>
      <section>
        <h2>Active Queues</h2>
        {loading ? (
          <p>Loading queues...</p>
        ) : queues.length === 0 ? (
          <p>No queues found. Create one above.</p>
        ) : (
          queues.map((queue) => {
            // Find the user who is currently being served (position === 0)
            const servedUser = queue.users ? queue.users.find(u => u.position === 0) : null;
            const servedMsg = servedUser 
              ? `You are serving now: ${servedUser.name}, ${servedUser.email}`
              : "You are serving now: No one";

            return (
              <div key={queue.id} className="queue-card" style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3>{queue.name}</h3>
                <p>Status: <span>{queue.status}</span></p>
                <p>Users: {queue.users ? queue.users.filter(u => u.position > 0).length : 0}</p>
                <p>{servedMsg}</p>
                {/* QR Code Display */}
                <div style={{ marginBottom: '1rem' }}>
                  <QRCodeGenerator queueId={queue.id} />
                </div>
                {/* Buttons container */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button 
                    className="btn" 
                    onClick={() => toggleQueueStatus(queue.id, queue.status)}
                    disabled={actionPending[queue.id]}
                  >
                    {queue.status === 'active' ? 'Pause' : 'Resume'}
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => nextQueue(queue.id)}
                    disabled={actionPending[queue.id]}
                  >
                    Next
                  </button>
                  <button 
                    className="btn delete-btn" 
                    onClick={() => deleteQueue(queue.id)}
                    disabled={actionPending[queue.id]}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};

export default QueueControls;
