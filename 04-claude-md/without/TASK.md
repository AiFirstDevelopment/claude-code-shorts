# Task

Build a URL shortener in server.js (node:http, no packages).

- POST /links with {"url"} returns 201 and {"code"}
- codes are 6 letters or digits
- GET /<code> redirects (302) to the url
- unknown codes are 404
- a url that isn't http or https is 400
- the same url always gets the same code
- GET /links/<code>/stats returns {"url", "visits"}
