const net = require('net');
const smtpServer = process.env.EMAIL_HOST || 'your-smtp-server.com';
const port = process.env.EMAIL_PORT || 587;

const client = new net.Socket();

client.connect(port, smtpServer, () => {
  console.log(`Connected to ${smtpServer}:${port}`);
  client.destroy();
});

client.on('error', (err) => {
  console.error('Connection failed:', err.message);
});

client.on('close', () => {
  console.log('Connection closed');
});