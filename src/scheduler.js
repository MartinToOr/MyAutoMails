const cron = require('node-cron');
const pool = require('./db');
const OpenAI = require('openai');
const nodemailer = require('nodemailer');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY || 'YOUR_API_KEY',
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function checkScripts() {

  const now = new Date();
  console.log('Scheduler tick', now.toISOString(), 'offset', now.getTimezoneOffset());

  try {
    const { rows } = await pool.query(`SELECT s.*, u.name, u.plan FROM scripts s JOIN users u ON s.user_id=u.id WHERE s.next_execution BETWEEN NOW() - INTERVAL '2 minutes' AND NOW() + INTERVAL '2 minutes'`);
    console.log('Scripts due:', rows.length);
    for (const script of rows) {
      const execDate = new Date(script.next_execution);
      console.log('Running script', script.id, 'scheduled for', execDate.toISOString());

      const plan = script.plan || 'free';
      const messages = [
        { role: 'system', content: 'Responde de forma natural sin mencionar que eres una IA. Usa internet si es necesario.' },
        { role: 'user', content: script.script },
      ];
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
      });
      let answer = completion.choices[0].message.content;
      if (plan === 'free' && answer.length > 500) {
        answer = answer.slice(0, 500) + '\nActualiza al plan pro para eliminar límites.';
      }
      const h = now.getHours();
      const greet = h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
      const prefix = `${greet} ${script.name}, aquí tienes tu información ${script.period === 24 ? 'diaria' : script.period === 168 ? 'semanal' : 'programada'}:\n`;
      answer = prefix + answer;
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: script.emails,
        subject: 'Script result',
        text: answer,
      });
      await pool.query('INSERT INTO email_history(user_id, script_id, response) VALUES ($1, $2, $3)', [script.user_id, script.id, answer]);
      await pool.query(
        "UPDATE scripts SET next_execution = next_execution + (period * interval '1 hour') WHERE id = $1",
        [script.id]
      );
      console.log('Script', script.id, 'next execution set to', new Date(execDate.getTime() + script.period * 3600000).toISOString());
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
