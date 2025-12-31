import { ImapFlow } from 'imapflow';

const client = new ImapFlow({
  host: 'mail.webador.com',
  port: 993,
  secure: true,
  auth: {
    user: 'admin@replii.ca',
    pass: '123456Admin@24',
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 30000,
});

(async () => {
  try {
    console.log('Connecting...');
    await client.connect();
    console.log('✔ LOGIN OK');
    await client.logout();
  } catch (err) {
    console.error('❌ ERROR:', err);
  }
})();
