# MyAutoMails

Simple web app for scheduling OpenAI-powered scripts and emailing the results.

## Setup
1. Install dependencies with `npm install` (requires internet access).
2. Create a PostgreSQL database and run `schema.sql`.
3. Configure environment variables for the database (set `DB_URL`), SMTP and OpenAI API keys.
4. Start the server with `npm start`.


Users can register via `/register.html`; passwords are hashed with bcrypt before
being stored. Login is available at `/index.html`.

The scheduler checks every minute for scripts whose `next_execution` is due and
sends the generated response to the configured email addresses.

