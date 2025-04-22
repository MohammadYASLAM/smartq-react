// src/pages/AuthPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/firebase-config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

//Define the AuthPage component
const AuthPage = () => {
  //Track whether we are showing the registration form (true) or the login form (false)
  const [isRegistering, setIsRegistering] = useState(false);
  //storing error msg for user
  const [errorMsg, setErrorMsg] = useState('');
  //Prepare the navigate function so we can redirect after success
  const navigate = useNavigate();


  //Function to handle login form submissiom
  const handleLogin = async (e) => {
    e.preventDefault();    // Prevent page reload
    const email = e.target.email.value;
    const password = e.target.password.value;
    setErrorMsg(''); //clear error msg if there wehre any
    try {
      // if login success dirent them to admin dashboard
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin/dashboard');
    } catch (error) {
      // if login not sucess display the error msg
      setErrorMsg(error.message);
    }
  };


  //Function to handle registration form submission
  const handleRegister = async (e) => {
    e.preventDefault();    // Prevent page reload
    const name = e.target.name.value;
    const email = e.target['reg-email'].value;
    const password = e.target['reg-password'].value;
    const confirmPassword = e.target['confirm-password'].value;
    setErrorMsg('');  //clear error msg if there wehre any

    //check if password and confimPassword Match
    if (password !== confirmPassword) {
      return setErrorMsg("Passwords do not match!");
    }
    try {
      //Create a new user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Save admin details to Firestore
      await setDoc(doc(db, "admins", user.uid), { name, email });
      navigate('/admin/dashboard'); //after sussessful resgitarion redirect to admindashboard
    } catch (error) {
      setErrorMsg(error.message); // not susscesful register  show error msg
    }
  };

  //Render the form UI
  return (
    <div className="form-container">
      {isRegistering ? (
        <form onSubmit={handleRegister}>
          <h2>Admin Register</h2>
           {/* Show error message if one exists */}
          {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
          <label>Name</label>
          <input type="text" name="name" placeholder="Enter your name" required />
          <label>Email</label>
          <input type="email" name="reg-email" placeholder="Enter your email" required />
          <label>Password</label>
          <input type="password" name="reg-password" placeholder="Enter your password" required />
          <label>Confirm Password</label>
          <input type="password" name="confirm-password" placeholder="Confirm your password" required />
          <button type="submit">Register</button>
          <p>
            Already have an account?{' '}
            <span style={{ color: 'blue', cursor: 'pointer' }} onClick={() => setIsRegistering(false)}>
              Login
            </span>
          </p>
        </form>
      ) : (
        <form onSubmit={handleLogin}>
          <h2>Admin Login</h2>
           {/* Show error message if one exists */}
          {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
          <label>Email</label>
          <input type="email" name="email" placeholder="Enter your email" required />
          <label>Password</label>
          <input type="password" name="password" placeholder="Enter your password" required />
          <button type="submit">Login</button>
          <p>
            Don't have an account?{' '}
            <span style={{ color: 'blue', cursor: 'pointer' }} onClick={() => setIsRegistering(true)}>
              Register
            </span>
          </p>
        </form>
      )}
    </div>
  );
};

export default AuthPage;
