// src/pages/UserQueue.js
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import QRCodeGenerator from '../components/QRCodeGenerator';
import { db } from '../firebase/firebase-config';
import { doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

const UserQueue = () => {
  const [searchParams] = useSearchParams();
  const queueId = searchParams.get('queueId');

  useEffect(() => {
    // Here you could listen for queue updates as in QueueStatus if needed
    const unsubscribe = onSnapshot(doc(db, "queues", queueId), (docSnap) => {
      if (!docSnap.exists()) {
        // Handle non-existent queue
      }
    });
    return () => unsubscribe();
  }, [queueId]);

  return (
    <div className="queue-status">
      <h2>Your Queue Position</h2>
      {/* You can display the status here similarly */}
      <QRCodeGenerator queueId={queueId} width={200} height={200} />
    </div>
  );
};

export default UserQueue;
