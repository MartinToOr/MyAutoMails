# MyAutoMails

Simple web app for scheduling OpenAI-powered scripts and emailing the results.

## Setup
1. Install dependencies with `npm install` (requires internet access).
2. Create a MySQL database and run `schema.sql`.
3. Configure environment variables for database, SMTP and OpenAI API keys.
4. Start the server with `npm start`.

The scheduler checks every minute for scripts whose `next_execution` is due and sends the generated response to the configured email addresses.

## Usage
Visit `http://localhost:3000/` to log in. New users can register at `/register.html`.
Passwords are hashed using bcrypt before being stored in MySQL.
