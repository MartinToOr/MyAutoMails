const cron = require('node-cron');
const pool = require('./db');
const OpenAI = require('openai');
const nodemailer = require('nodemailer');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY || 'YOUR_API_KEY',
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'user',
    pass: process.env.SMTP_PASS || 'pass',
  },
});

async function checkScripts() {
  console.log('Scheduler tick', new Date().toISOString());
  try {
    const { rows } = await pool.query('SELECT * FROM scripts WHERE next_execution <= NOW()');
    for (const script of rows) {
      console.log('Running script', script.id);
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: script.script }],
      });
      const answer = completion.choices[0].message.content;
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: script.emails,
        subject: 'Script result',
        text: answer,
      });
      await pool.query(
        'UPDATE scripts SET next_execution = next_execution + (period * interval \'1 hour\') WHERE id = $1',
        [script.id]
      );
    }
  } catch (err) {
    console.error('Scheduler error', err);
  }
}

module.exports.start = () => {
  cron.schedule('* * * * *', checkScripts); // run every minute
};
