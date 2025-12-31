import { ImapFlow } from 'imapflow';

async function testIMAP() {
  try {
    const client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: 'reazulislam1487@gmail.com',
        pass: 'fyfsxytlwvnoxrme', // Gmail App Password
      },
    });

    console.log('Connecting to IMAP...');
    await client.connect();
    console.log('✅ IMAP connected successfully!');

    // 🔥 1️⃣ LIST ALL MAILBOXES / SUBFOLDERS
    console.log('\n📁 Listing all mailboxes (subfolders)...');
    for await (let mailbox of await client.list()) {
      console.log(`- ${mailbox.path}`);
    }
    console.log('📁 Mailbox listing complete.\n');

    // 🔓 2️⃣ OPEN INBOX
    const lock = await client.getMailboxLock('INBOX');
    console.log('📂 INBOX opened');

    // 3️⃣ SEARCH UNSEEN MESSAGES
    const unseen = await client.search({ seen: false });

    if (!unseen || unseen.length === 0) {
      console.log('📭 No unseen messages found.');
      lock.release();
      await client.logout();
      return;
    }

    console.log(`🔍 Found ${unseen.length} unseen messages`);

    // 4️⃣ Take last 10 unseen messages
    const last10 = unseen.slice(-10);
    console.log(`📨 Fetching last ${last10.length} unseen messages...\n`);

    // 5️⃣ FETCH SUBJECT + FROM + DATE
    for await (const msg of client.fetch(last10, { envelope: true })) {
      const env = msg.envelope || {};

      const subject = env.subject || '(no subject)';
      const from =
        env.from && env.from[0] && env.from[0].address
          ? env.from[0].address
          : '(unknown sender)';
      const date = env.date || '(no date available)';

      console.log('-------------------------');
      console.log('📧 Subject:', subject);
      console.log('👤 From:', from);
      console.log('🕒 Date:', date);
    }

    lock.release();
    console.log('\n🔓 Mailbox unlocked.');

    await client.logout();
    console.log('👋 Logged out successfully.');
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  }
}

testIMAP();
