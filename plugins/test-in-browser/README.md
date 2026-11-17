# test-in-browser

A Claude Code plugin: it opens your web app in a real browser (through the
[Playwright MCP server](https://github.com/microsoft/playwright-mcp), which the plugin sets up), tests its flows,
reports what broke with steps and screenshots, and writes Playwright tests for it that run in CI.

## Install

```
/plugin marketplace add AiFirstDevelopment/claude-code-shorts
/plugin install test-in-browser@claude-code-shorts
```

You need [Node.js](https://nodejs.org) 18 or later. The first run downloads the Playwright MCP server with `npx`.

## Use

Start your app, start Claude Code in its folder, then:

```
/test-in-browser http://localhost:3000
/test-in-browser http://localhost:3000 search and the orders pages
```

## Logins

It never automates a sign-in provider. If your app needs a login, sign in once yourself in the browser it opens; the
browser keeps its profile, so later runs start signed in. The tests it writes sign in with a test account from
`E2E_USER` and `E2E_PASSWORD` (CI secrets) and reuse the session.

## In CI

Exploring is done with Claude Code on your machine. CI runs only the Playwright tests it wrote: plain code, no AI, no
cost per run, the same result every time.

A real run is in [`11-test-in-browser`](../../11-test-in-browser).
