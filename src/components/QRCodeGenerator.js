// src/components/QRCodeGenerator.js
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRCodeGenerator = ({ queueId, width = 150, height = 150 }) => {
  let baseUrl;
  if (process.env.NODE_ENV === 'development') {
    // In development, use the origin (e.g., http://localhost:3000)
    baseUrl = window.location.origin;
  } else {
    // In production on GitHub Pages, force the base URL to the full absolute URL.
    baseUrl = "https://mohammadyaslam.github.io/smartq-react";
  }
  
  // Remove any trailing slashes to avoid double slashes in the URL
  baseUrl = baseUrl.replace(/\/+$/, "");

  // Construct the full QR code URL using HashRouter routing
  const qrText = `${baseUrl}/#/join-queue?queueId=${queueId}`;
  
  console.log("QR Code URL:", qrText); // For debugging: check the console output in production

  return <QRCodeCanvas value={qrText} size={width} />;
};

export default QRCodeGenerator;
