# MyAutoMails

Simple web app for scheduling OpenAI-powered scripts and emailing the results.
Uses OpenAI's GPT-4.1-mini model with built-in web search to keep answers current while remaining inexpensive.

## Setup
1. Install dependencies with `npm install` (requires internet access).
2. Create a PostgreSQL database and run `schema.sql` to create the tables. This

   includes `test_runs` (used to limit daily prompt tests), `email_history`
   for storing previous emails and a `created_at` column in `users` to enforce
   expirations.

3. Configure environment variables for the database (set `DB_URL`), SMTP and OpenAI API keys.
4. Start the server with `npm start`.

Users register at `/register.html`. After entering their details they choose the free or pro plan on a second step. Passwords are hashed with bcrypt before being stored. Login is available at `/index.html`.

The scheduler checks every five minutes. If a script's `next_execution` time falls within two minutes of the current time, it triggers a request to OpenAI and mails the response to the specified recipients.

Script times must be set using minutes in five minute increments (00, 05, 10, ... 55).
The client sends its timezone offset so scheduled times are normalized to the server's UTC clock.


A collapsible sidebar can be toggled using the menu button (☰) on pages after logging in. The profile page lets users update their name, password or plan and delete the account.


### Plans
Free accounts expire after three months and may only schedule one daily and one
weekly script. Free scripts are limited to 300 characters of input and
approximately 500 characters of output. Pro accounts raise the input limit to
600 characters and remove the output cap.

