# MyAutoMails

Simple web app for scheduling OpenAI-powered scripts and emailing the results.

## Setup
1. Install dependencies with `npm install` (requires internet access).
2. Create a PostgreSQL database and run `schema.sql`.
3. Configure environment variables for the database (set `DB_URL`), SMTP and OpenAI API keys.
4. Start the server with `npm start`.

Users can register via `/register.html`; passwords are hashed with bcrypt before being stored. Login is available at `/index.html`.

The scheduler checks every five minutes. If a script's `next_execution` time falls within two minutes of the current time, it triggers a request to OpenAI and mails the response to the specified recipients.
Script times must be set using minutes in five minute increments (00, 05, 10, ... 55).
