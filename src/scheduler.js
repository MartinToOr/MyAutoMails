const cron = require('node-cron');
const pool = require('./db');
const { Configuration, OpenAIApi } = require('openai');
const nodemailer = require('nodemailer');

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_KEY || 'YOUR_API_KEY',
}));

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
  try {
    const [rows] = await pool.query('SELECT * FROM scripts WHERE next_execution <= NOW()');
    for (const script of rows) {
      const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: script.script }],
      });
      const answer = response.data.choices[0].message.content;
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: script.emails,
        subject: 'Script result',
        text: answer,
      });
      await pool.query('UPDATE scripts SET next_execution = DATE_ADD(next_execution, INTERVAL period HOUR) WHERE id = ?', [script.id]);
    }
  } catch (err) {
    console.error('Scheduler error', err);
  }
}

module.exports.start = () => {
  cron.schedule('* * * * *', checkScripts); // run every minute
};
