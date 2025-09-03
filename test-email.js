require('dotenv').config();
const nodemailer = require('nodemailer');

// Create transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,      // e.g., smtp.gmail.com
  port: process.env.EMAIL_PORT,      // 587
  secure: false,                     // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,    // your Gmail
    pass: process.env.EMAIL_PASS     // Gmail App Password (not normal password)
  }
});

// Test email
transporter.sendMail({
  from: `"My App" <${process.env.EMAIL_USER}>`,  // sender
  to: 'recipient@example.com',                   // change to your test email
  subject: 'Test Email',
  text: 'This is a test email from Node.js!'
}, (err, info) => {
  if (err) console.error('Error sending email:', err);
  else console.log('Email sent:', info.response);
});
