---
name: test-in-browser
description: Test a web app in a real browser through the Playwright MCP server - explore its pages, check the patterns it uses (search, list and detail, forms, navigation) and the usual failures (console errors, failed requests, broken links, phone-width layout), report each problem with steps and a screenshot, then write Playwright tests that run in CI without AI. Use when the user asks to test their site or app in a browser, find UI bugs, check a flow end to end, or write end-to-end tests.
argument-hint: <url> [what to focus on, e.g. "search and the orders pages"]
---

# Test it in a real browser

You drive a real browser with the Playwright MCP tools (`browser_navigate`, `browser_snapshot`, `browser_click`,
`browser_type`, `browser_console_messages`, `browser_network_requests`, `browser_resize`, `browser_take_screenshot`).
Read pages with `browser_snapshot` (the accessibility tree), not by guessing from screenshots.

## 1. Start

- Open the URL. If it doesn't load, stop and say so: the app has to be running.
- **Log in once, by hand.** If the app needs a login, don't type anyone's password and don't automate a sign-in
  provider (Google, Okta, GitHub): their pages block bots and they aren't your code. Ask the user to sign in in the
  browser window you opened, and wait. The browser keeps its profile, so the next run starts signed in. Then test the
  app's own pages behind the login.
- Never pay, send email or delete real data. Use a local or staging copy with test data.

## 2. Map the app

- Follow the navigation and list the pages and the patterns on them: search, a list with a detail page, forms, filters
  and sorting, pagination, tabs. With a focus given, map that part only.

## 3. Check each pattern for what it promises

- **Search:** search for something you saw on the page and expect it in the results; an empty query; a term that
  should match nothing (expect a "no results" message, not an error); different capital letters; a non-English word.
  Reload and press Back: the query and results should survive. If the query is in the URL, open that URL directly.
- **List and detail:** click a row and check the detail shows the same item (same name, same id). Go back: the list
  keeps its filter, sort and scroll position. Open a detail URL directly, and one with an id that doesn't exist
  (expect a "not found" page, not a crash). If the detail can be edited, change a field and check the list shows it.
- **Forms:** submit empty, submit with a wrong value in each field, then submit correctly. Errors should say which
  field and why; nothing should submit twice on a double click.
- **Everywhere:** read `browser_console_messages` and `browser_network_requests` on every page: any error or failed
  request (4xx, 5xx) is a finding. Check every link you passed. Resize to 390x844 (a phone) and look for text cut
  off, controls off screen, or anything you can't tap.

## 4. Report

- One entry per problem, worst first: the page, the steps to reproduce it, what you expected, what happened, and a
  screenshot. Then what you checked that worked, and what you couldn't check (anything behind a payment or an
  external system).

## 5. Write the tests

- Write Playwright tests in the project's own test folder and style (if it has none, `tests/e2e/` with a
  `playwright.config.ts` whose `baseURL` comes from an environment variable).
- One test for each problem found (it fails now: run it and show the failure) and one for each pattern that works
  (it passes now). Assert on relationships, not exact text: "the row I clicked is the item the detail shows", "a
  search for a word on the page finds it".
- If the app needs a login, add a setup test that signs in with a **test account** from environment variables
  (`E2E_USER`, `E2E_PASSWORD`) and saves `storageState`, and make the other tests use it. In CI those two values are
  secrets.
- Run the tests headless and give the result. They need no AI and give the same result every run, so CI runs them
  (`npx playwright test`). Don't add CI files or commit unless asked.
