const cron = require('node-cron');
const pool = require('./db');
const OpenAI = require('openai');
const nodemailer = require('nodemailer');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY || 'YOUR_API_KEY',
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'user',
    pass: process.env.SMTP_PASS || 'pass',
  },
  logger: true,
  debug: true,
});

// verify SMTP configuration at startup
transporter.verify().then(() => {
  console.log('SMTP connection configuration is valid');
}).catch(err => {
  console.error('SMTP connection error', err);
});

async function checkScripts() {
  const now = new Date();
  console.log('Scheduler tick', now.toISOString(), 'offset', now.getTimezoneOffset());
  try {
    const { rows } = await pool.query("SELECT * FROM scripts WHERE next_execution BETWEEN NOW() - INTERVAL '2 minutes' AND NOW() + INTERVAL '2 minutes'");
    console.log('Scripts due:', rows.length);
    for (const script of rows) {
      const execDate = new Date(script.next_execution);
      console.log('Running script', script.id, 'scheduled for', execDate.toISOString());
      try {
        console.log('Requesting completion from OpenAI');
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: script.script }],
        });
        const answer = completion.choices[0].message.content;
        console.log('OpenAI response received');
        console.log('Sending email to', script.emails);
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@example.com',
          to: script.emails,
          subject: 'Script result',
          text: answer,
        });
        console.log('Email sent:', info.messageId);
        await pool.query(
          "UPDATE scripts SET next_execution = next_execution + (period * interval '1 hour') WHERE id = $1",
          [script.id]
        );
        console.log(
          'Script',
          script.id,
          'next execution set to',
          new Date(execDate.getTime() + script.period * 3600000).toISOString()
        );
      } catch (err) {
        console.error('Error running script', script.id, err);
      }
    }
    if (rows.length === 0) {
      console.log('No scripts to run this tick');
    }
  } catch (err) {
    console.error('Scheduler error', err);
  }
}

module.exports.start = () => {
  cron.schedule('*/5 * * * *', checkScripts); // run every 5 minutes
};
