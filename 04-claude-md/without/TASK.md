# Task

Build a small online store's orders API in server.js (node:http, no packages).
Export start(port), which starts it and returns the listening server.

- POST /orders with {"customerId", "item"} returns 201 and {"id", "status": "placed"}
- GET /orders/<id> returns {"id", "customerId", "item", "status"}
- an unknown id is 404
- an order without an item is 400
- POST /orders/<id>/ship sets the status to "shipped" and returns the order
