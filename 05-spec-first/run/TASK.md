# Task

Build a URL shortener in server.js (node:http, no packages).

- POST /links with {"url"} returns 201 and {"code"}
- codes are 6 letters or digits
- GET /<code> redirects (302) to the url
- unknown codes are 404
- a url that isn't http or https is 400
- the same url always gets the same code
- GET /links/<code>/stats returns {"url", "visits"}

## Change a link's url

- PUT /links/<code> with {"url"} returns 200 and {"code", "url"} with the new url (assumed: PUT, 200)
- only admins change links: header x-admin-key = ADMIN_KEY (env), or 403; if ADMIN_KEY is unset, every change is 403 (assumed)
- the key is checked first: a change without the right key is 403 even for an unknown code (assumed)
- after a change, GET /<code> redirects (302) to the new url and the code stays the same
- visits are kept across a change (assumed)
- an unknown code is 404
- a new url that isn't http or https is 400; a body that isn't JSON is 400
- a new url that already has a different code is 409, and neither link changes (assumed: keeps "same url, same code")
- changing a link to the url it already has returns 200 and changes nothing
- after a change, POST /links with the new url returns that code, and with the old url returns a different, new code (assumed)
