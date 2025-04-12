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
  const [queues, setQueues] = useState([]);
  const [queueName, setQueueName] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState({}); // to track pending operations on a queue
  const navigate = useNavigate();
  const queueCollection = collection(db, "queues");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(queueCollection, where("adminId", "==", user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const allQueues = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
          setQueues(allQueues);
          setLoading(false);
        });
        return () => unsubscribe();
      } else {
        navigate('/auth');
      }
    });
    return unsubscribeAuth;
  }, [navigate, queueCollection]);

  const createQueue = async (e) => {
    e.preventDefault();
    if (!queueName.trim()) return;
    try {
      const user = auth.currentUser;
      const newQueue = {
        name: queueName,
        adminId: user.uid,
        status: "active",
        users: [],
        currentPosition: 1,
        estimatedWaitTime: 0,
        createdAt: new Date()
      };
      await addDoc(queueCollection, newQueue);
      setQueueName('');
    } catch (error) {
      console.error("Error creating queue:", error);
    }
  };

  const toggleQueueStatus = async (queueId, currentStatus) => {
    setActionPending(prev => ({ ...prev, [queueId]: true }));
    try {
      const queueDoc = doc(db, "queues", queueId);
      // Toggle status between "active" and "paused"
      await updateDoc(queueDoc, { status: currentStatus === "active" ? "paused" : "active" });
    } catch (error) {
      console.error(error);
    }
    setActionPending(prev => ({ ...prev, [queueId]: false }));
  };

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
      await updateDoc(queueDoc, { users });
    } catch (error) {
      console.error(error);
    }
    setActionPending(prev => ({ ...prev, [queueId]: false }));
  };

  const deleteQueue = async (queueId) => {
    if (!window.confirm("Are you sure you want to delete this queue? This action cannot be undone.")) return;
    setActionPending(prev => ({ ...prev, [queueId]: true }));
    try {
      await deleteDoc(doc(db, "queues", queueId));
    } catch (error) {
      console.error(error);
    }
    setActionPending(prev => ({ ...prev, [queueId]: false }));
  };

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
