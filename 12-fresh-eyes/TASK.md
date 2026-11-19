# Task

Build a sign-up and login API in server.js (node:http, no packages, users kept in memory). Export start(port).

- POST /signup with {"email", "password"} returns 201 and {"id", "email"}
- emails are stored in lower case, so the same email in any case is 409
- a password shorter than 12 characters is 400
- no response ever contains the password
- passwords are stored hashed with crypto.scrypt and a random salt, never as plain text
- POST /login with the right email and password returns 200 and {"token"}; anything else is 401, with the same message whether the email exists or not
- after 5 wrong passwords for an email, login for it is 429 for 15 minutes
