// Browser checks of /learn, its episode pages and the blog's tag filter (test-in-browser run, 2026-11-17),
// beyond what learn.spec.ts and blog.spec.ts already cover.
import { expect, test } from './fixtures'

const seconds = (length: string) => length.split(':').map(Number).reduce((total, part) => total * 60 + part, 0)
/** "1 h 40 min" or "17 min" as minutes. */
const minutes = (text: string) => { const m = /(?:(\d+) h )?(\d+) min/.exec(text)!; return Number(m[1] ?? 0) * 60 + Number(m[2]) }

test('learn: each series\' episode count and length, and the page total, are the sums of its episodes', async ({ page }) => {
  await page.goto('/learn')
  const series = page.locator('main section section').filter({ has: page.locator('p', { hasText: /^Series \d/ }) })
  let episodes = 0
  let total = 0
  for (const one of await series.all()) {
    const meta = (await one.locator('p').first().textContent())!
    const lengths = await one.locator('li p:first-child').allTextContents()
    const sum = lengths.reduce((s, text) => s + seconds(/(\d+:\d+(?::\d+)?)/.exec(text)![1]), 0)
    expect(Number(/(\d+) episodes/.exec(meta)![1]), meta).toBe(lengths.length)
    expect(Math.abs(minutes(meta) - sum / 60), meta).toBeLessThanOrEqual(1)
    episodes += lengths.length
    total += sum
  }
  const top = (await page.locator('main p').first().textContent())!
  expect(Number(/(\d+) episodes/.exec(top)![1])).toBe(episodes)
  expect(Math.abs(minutes(top) - total / 60)).toBeLessThanOrEqual(1)
})

test('learn: the episode clicked in the list is the episode its page shows, and Back returns to the list', async ({ page }) => {
  await page.goto('/learn')
  const link = page.locator('main li h3 a').nth(4)
  const title = (await link.textContent())!.trim()
  await link.click()
  await expect(page.locator('h1')).toHaveText(title)
  await page.goBack()
  await expect(page).toHaveURL(/\/learn$/)
})

test('learn: an episode address that does not exist answers 404 with the site\'s not-found page', async ({ page }) => {
  const response = await page.goto('/learn/s9e9-no-such-episode')
  expect(response!.status()).toBe(404)
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('header.site')).toHaveCount(1)
})

test('blog: every tag shows only the posts that carry it, and together the tags cover every post', async ({ page }) => {
  await page.goto('/blog')
  const group = page.getByRole('group', { name: 'Show the posts tagged' })
  const everyPost = await page.locator('main .posts > li h2').allTextContents()
  const seen = new Set<string>()
  for (const tag of (await group.getByRole('button').allTextContents()).filter((t) => t !== 'All')) {
    await group.getByRole('button', { name: tag, exact: true }).click()
    await expect(group.getByRole('button', { name: tag, exact: true })).toHaveAttribute('aria-pressed', 'true')
    const shown = page.locator('main .posts > li:visible')
    expect(await shown.count(), tag).toBeGreaterThan(0)
    for (const tags of await shown.evaluateAll((items) => items.map((li) => (li as HTMLElement).dataset.tags!.split('|')))) expect(tags, tag).toContain(tag)
    for (const title of await shown.locator('h2').allTextContents()) seen.add(title)
  }
  expect([...seen].sort()).toEqual([...everyPost].sort())
})

test('blog: a filtered list survives opening a post and pressing Back, and a ?tag= address opens filtered', async ({ page }) => {
  await page.goto('/blog')
  const group = page.getByRole('group', { name: 'Show the posts tagged' })
  await group.getByRole('button', { name: 'Tuning the demo', exact: true }).click()
  const filtered = await page.locator('main .posts > li:visible h2').allTextContents()
  await page.locator('main .posts > li:visible h2 a').first().click()
  await expect(page).toHaveURL(/\/blog\/[a-z0-9-]+$/)
  await page.goBack()
  await expect(page.locator('main .posts > li:visible h2')).toHaveText(filtered)
  await page.goto('/blog?tag=Tuning%20the%20demo')
  await expect(page.locator('main .posts > li:visible h2')).toHaveText(filtered)
})

test('blog: a ?tag= that names no tag shows every post with All pressed', async ({ page }) => {
  await page.goto('/blog')
  const all = await page.locator('main .posts > li').count()
  await page.goto('/blog?tag=No-such-tag')
  await expect(page.locator('main .posts > li:visible')).toHaveCount(all)
  await expect(page.getByRole('button', { name: 'All', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('blog: a ?tag= address in other capital letters still filters by that tag', async ({ page }) => {
  await page.goto('/blog?tag=Evals')
  const exact = await page.locator('main .posts > li:visible h2').allTextContents()
  await page.goto('/blog?tag=evals')
  await expect(page.locator('main .posts > li:visible h2')).toHaveText(exact)
})
