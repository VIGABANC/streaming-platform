import { test, expect } from '@playwright/test'

const VIEWPORTS = [
  { width: 375, height: 667, name: '375 iPhone SE' },
  { width: 390, height: 844, name: '390 iPhone 12/13/14' },
  { width: 430, height: 932, name: '430 iPhone Pro Max' },
  { width: 768, height: 1024, name: '768 Tablet' },
  { width: 1024, height: 768, name: '1024 Small Desktop' },
  { width: 1280, height: 800, name: '1280 Desktop' },
  { width: 1440, height: 900, name: '1440 Large Desktop' },
]

test.describe('Landing Page — The Night Signal QA Verification', () => {
  for (const vp of VIEWPORTS) {
    test(`renders without horizontal overflow at ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/')

      // Ensure page finishes loading initial DOM
      await expect(page.getByRole('main')).toBeVisible()

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      expect(hasOverflow).toBe(false)
    })
  }

  test('validates single H1, semantic landmarks, and hero CTAs', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    // Exactly one H1 on the entire landing page
    const h1Headings = page.getByRole('heading', { level: 1 })
    await expect(h1Headings).toHaveCount(1)
    await expect(h1Headings).toBeVisible()

    // Semantic main and footer landmarks
    const main = page.getByRole('main')
    await expect(main).toBeVisible()
    const footer = page.getByRole('contentinfo')
    await expect(footer).toBeVisible()

    // Hero CTA links
    const startExploring = page.getByRole('link', { name: 'Start Exploring' })
    await expect(startExploring).toBeVisible()
    await expect(startExploring).toHaveAttribute('href', '/browse')
    await expect(startExploring).toHaveCSS('min-height', '48px')

    const trendingTonight = page.getByRole('link', { name: 'Trending Tonight' })
    await expect(trendingTonight).toBeVisible()
    await expect(trendingTonight).toHaveAttribute('href', '#trending-tonight')

    // Trending anchor target exists
    const trendingAnchor = page.locator('#trending-tonight')
    await expect(trendingAnchor).toBeAttached()
  })

  test('desktop navigation at 1440px displays full links and hides mobile nav', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const banner = page.getByRole('banner')
    const mainNav = banner.getByRole('navigation', { name: 'Main navigation' })
    await expect(mainNav).toBeVisible()

    await expect(mainNav.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Discover' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Movies' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'TV Shows' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Search' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Watchlist' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Explore VEYRA' })).toHaveAttribute('href', '/browse')

    // Mobile menu button and bottom mobile nav should not be visible at 1440px
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).not.toBeVisible()
    await expect(page.locator('nav[aria-label="Mobile navigation"]')).not.toBeVisible()
  })

  test('mobile navigation at 390px renders 5 items and mobile drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    // Desktop main nav in header should be hidden
    const banner = page.getByRole('banner')
    await expect(banner.getByRole('navigation', { name: 'Main navigation' })).not.toBeVisible()

    // 5-item mobile bottom navigation
    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]').first()
    await expect(mobileNav).toBeVisible()
    const mobileLinks = mobileNav.getByRole('link')
    await expect(mobileLinks).toHaveCount(5)
    await expect(mobileNav.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    await expect(mobileNav.getByRole('link', { name: 'Movies' })).toHaveAttribute('href', '/movies')
    await expect(mobileNav.getByRole('link', { name: 'TV' })).toHaveAttribute('href', '/tv')
    await expect(mobileNav.getByRole('link', { name: 'Discover' })).toHaveAttribute('href', '/browse')
    await expect(mobileNav.getByRole('link', { name: 'My List' })).toHaveAttribute('href', '/my-list')

    // Hamburger toggle open and close with aria-expanded
    const menuButton = page.locator('button[aria-controls="landing-mobile-menu"]')
    await expect(menuButton).toBeVisible()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    await menuButton.click()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    const mobileDrawer = page.locator('#landing-mobile-menu')
    await expect(mobileDrawer).toBeVisible()

    // Close via escape key
    await page.keyboard.press('Escape')
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    await expect(menuButton).toBeFocused()
  })

  test('validates touch targets are at least 44x44px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    // Mobile nav touch targets
    const mobileNavLinks = page.locator('nav[aria-label="Mobile navigation"] a')
    const count = await mobileNavLinks.count()
    for (let i = 0; i < count; i++) {
      const box = await mobileNavLinks.nth(i).boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }

    // Mobile menu toggle button
    const menuButton = page.getByRole('button', { name: 'Open navigation menu' })
    const toggleBox = await menuButton.boundingBox()
    expect(toggleBox).not.toBeNull()
    if (toggleBox) {
      expect(toggleBox.width).toBeGreaterThanOrEqual(44)
      expect(toggleBox.height).toBeGreaterThanOrEqual(44)
    }

    // Footer links min-height
    const footer = page.getByRole('contentinfo')
    const footerLinks = footer.getByRole('link')
    const footerCount = await footerLinks.count()
    for (let i = 0; i < footerCount; i++) {
      const minHeight = await footerLinks.nth(i).evaluate((el) => {
        return window.getComputedStyle(el).minHeight
      })
      expect(minHeight).toBe('44px')
    }
  })

  test('validates metadata, canonical link, OG tags, and disclaimers', async ({ page }) => {
    await page.goto('/')

    // Canonical link
    const canonical = page.locator('link[rel="canonical"]')
    await expect(canonical).toHaveAttribute('href', 'https://veyra.stream')

    // OpenGraph and Twitter tags
    const ogTitle = page.locator('meta[property="og:title"]')
    await expect(ogTitle).toHaveAttribute('content', /VEYRA/i)

    const ogSiteName = page.locator('meta[property="og:site_name"]')
    await expect(ogSiteName).toHaveAttribute('content', 'VEYRA')

    const twitterCard = page.locator('meta[name="twitter:card"]')
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image')

    // Robots tag
    const robots = page.locator('meta[name="robots"]')
    await expect(robots).toHaveAttribute('content', 'index, follow')

    // TMDB and Provider disclaimers in footer
    const footer = page.getByRole('contentinfo')
    await expect(footer).toContainText('This product uses the TMDB API but is not endorsed or certified by TMDB.')
    await expect(footer).toContainText('VEYRA does not host or store video media. Playback is provided by third-party providers.')
  })

  test('validates reduced motion behavior', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    // In reduced motion, sections and hero are immediately rendered
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByTestId('media-rail-trending-tonight')).toBeVisible()
    await expect(page.getByTestId('discovery-showcase')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Featured story' })).toBeVisible()
  })

  test('device and player sections are visible with expected content', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    // Device showcase section
    const deviceSection = page.getByRole('region', { name: 'Cinema follows you.' })
    await expect(deviceSection).toBeVisible()
    await expect(deviceSection.getByText('Desktop')).toBeVisible()
    await expect(deviceSection.getByText('Tablet')).toBeVisible()
    await expect(deviceSection.getByText('Mobile')).toBeVisible()

    // Player showcase section
    const playerSection = page.getByRole('region', { name: 'From discovery to play.' })
    await expect(playerSection).toBeVisible()
    await expect(playerSection.getByText('Illustrative player state')).toBeVisible()
    await expect(playerSection.getByText('Connecting to a provider')).toBeVisible()
    await expect(playerSection).toContainText('VEYRA does not host or store video media.')
  })

  test('keyboard focus navigation through hero and landing elements', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    // Focus skip link
    const skipLink = page.locator('a.skip-link').first()
    await skipLink.focus()
    await expect(skipLink).toBeFocused()

    // Tab through nav to Start Exploring
    let foundStartExploring = false
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab')
      const isStart = await page.getByRole('link', { name: 'Start Exploring' }).evaluate((el) => el === document.activeElement)
      if (isStart) {
        foundStartExploring = true
        break
      }
    }
    expect(foundStartExploring).toBe(true)

    // Next tab should focus Trending Tonight
    await page.keyboard.press('Tab')
    const isTrending = await page.getByRole('link', { name: 'Trending Tonight' }).evaluate((el) => el === document.activeElement)
    expect(isTrending).toBe(true)
  })

  test('renders full fallback experience gracefully when landing data is unavailable', async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'x-veyra-e2e-landing-data': 'unavailable' })
    await page.goto('/')

    // Single H1 remains
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find the story worth staying up for.')

    // Hero fallback background
    await expect(page.getByRole('region', { name: 'Featured story' }).locator('img')).toHaveCount(0)

    // Rails display empty message
    const trendingRail = page.getByTestId('media-rail-trending-tonight')
    await expect(trendingRail).toBeVisible()
    await expect(trendingRail).toContainText('The signal is quiet for now. Check back shortly.')

    // Detail showcase fallback
    const detailSection = page.getByRole('region', { name: 'Every signal has a story.' })
    await expect(detailSection).toBeVisible()
    await expect(detailSection.getByText('Detail signal unavailable')).toBeVisible()
    await expect(detailSection.getByRole('link', { name: 'Browse the catalog' })).toHaveAttribute('href', '/browse')

    // Episode showcase fallback
    const episodeSection = page.getByRole('region', { name: 'Every season. Every episode.' })
    await expect(episodeSection).toBeVisible()
    await expect(episodeSection.getByText('Season information is unavailable right now.')).toBeVisible()

    // Actionable routes work
    await expect(page.getByRole('link', { name: 'Start Exploring' })).toHaveAttribute('href', '/browse')
  })
})
