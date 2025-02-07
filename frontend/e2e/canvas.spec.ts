import { test, expect } from '@playwright/test'

test.describe('Canvas Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth token
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'test-token')
    })
  })

  test('should load canvas page with initial state', async ({ page }) => {
    await page.goto('/canvas')
    
    // Check for main elements
    await expect(page.getByText('Canvas')).toBeVisible()
    await expect(page.getByPlaceholder(/describe your image/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /generate image/i })).toBeDisabled()
  })

  test('should handle image generation flow', async ({ page }) => {
    await page.goto('/canvas')

    // Type prompt
    const promptInput = page.getByPlaceholder(/describe your image/i)
    await promptInput.fill('test prompt')
    
    // Generate button should be enabled
    const generateButton = page.getByRole('button', { name: /generate image/i })
    await expect(generateButton).toBeEnabled()
    
    // Click generate
    await generateButton.click()
    
    // Should show loading state
    await expect(page.getByText(/preparing your canvas/i)).toBeVisible()
  })

  test('should handle gallery navigation', async ({ page }) => {
    await page.goto('/canvas')

    // Switch to recent tab
    await page.getByRole('button', { name: /recent/i }).click()
    
    // Should show loading state for gallery
    await expect(page.getByRole('progressbar')).toBeVisible()
    
    // Switch to favorites tab
    await page.getByRole('button', { name: /favorites/i }).click()
    
    // Switch to feed tab
    await page.getByRole('button', { name: /feed/i }).click()
  })

  test('should handle image viewer interactions', async ({ page }) => {
    await page.goto('/canvas')
    await page.getByRole('button', { name: /recent/i }).click()

    // Wait for images to load and click first image
    await page.waitForSelector('img[alt]')
    await page.locator('img[alt]').first().click()
    
    // Check viewer is open
    await expect(page.getByRole('dialog')).toBeVisible()
    
    // Close viewer
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('should handle responsive layout', async ({ page }) => {
    await page.goto('/canvas')

    // Test desktop layout
    await expect(page.getByText('Canvas')).toBeVisible()
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByText('Canvas')).toBeVisible()
  })
}) 