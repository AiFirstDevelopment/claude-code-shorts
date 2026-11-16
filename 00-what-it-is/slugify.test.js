// The check: the tests Claude Code had to make pass. One test per rule in TASK.md.
// Run them with: npm test

import test from 'node:test'
import assert from 'node:assert/strict'
import { slugify } from './slugify.js'

// Rules: lowercase; spaces become hyphens.
test('lowercase, spaces to hyphens', () => {
  const slug = slugify('Hello World')
  assert.equal(slug, 'hello-world')
})

// Rule: punctuation is removed.
test('punctuation is removed', () => {
  const slug = slugify("What's new in 2026?")
  assert.equal(slug, 'whats-new-in-2026')
})

// Rule: no double hyphens, none at the ends.
test('no double hyphens, none at the ends', () => {
  const slug = slugify('  Plan mode -- and why!  ')
  assert.equal(slug, 'plan-mode-and-why')
})
