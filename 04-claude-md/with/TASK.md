# Task

Build a small products API in server.js (node:http, no packages).
Export start(port), which starts it and returns the listening server.

- POST /products with {"name"} returns 201 and {"id", "name"}
- GET /products/<id> returns {"id", "name"}
- an unknown id is 404
- a product without a name is 400
