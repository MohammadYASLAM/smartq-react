// src/pages/LandingPage.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/auth');
    }, 5000); // redirect after 5 seconds
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="landing-page">
      <img src={`${process.env.PUBLIC_URL}/images/smartq-logo.png`} alt="SmartQ Logo" className="logo-image" />
    </div>
  );
};

export default LandingPage;
