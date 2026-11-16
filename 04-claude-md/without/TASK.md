# Task

Build a small user accounts API in server.js (node:http, no packages).
Export start(port), which starts it and returns the listening server.

- POST /users with {"name", "email"} returns 201 and {"id"}
- GET /users/<id> returns {"id", "name", "email"}
- an unknown id is 404
- an email without an @ is 400
- POST /users/<id>/orders with {"item"} returns 201 and {"id"}
- GET /users/<id>/orders returns the user's orders as a list
