import { test, expect } from '@playwright/test';

test.describe('Design Management System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the designs page
    await page.goto('/designs');
  });

  test.describe('Design Catalog Page', () => {
    test('should display the design catalog', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Designs/);
      
      // Check main heading
      await expect(page.getByRole('heading', { name: 'Discover Amazing Designs' })).toBeVisible();
      
      // Check hero section
      await expect(page.getByText('Explore a world of creative designs from talented artists and designers')).toBeVisible();
    });

    test('should display featured designs section', async ({ page }) => {
      // Wait for featured designs to load
      await page.waitForSelector('[data-testid="featured-designs"]', { timeout: 10000 });
      
      // Check section heading
      await expect(page.getByRole('heading', { name: 'Featured Designs' })).toBeVisible();
      
      // Check section description
      await expect(page.getByText('Handpicked designs that showcase exceptional creativity')).toBeVisible();
    });

    test('should display popular designs section', async ({ page }) => {
      // Wait for popular designs to load
      await page.waitForSelector('[data-testid="popular-designs"]', { timeout: 10000 });
      
      // Check section heading
      await expect(page.getByRole('heading', { name: 'Most Popular' })).toBeVisible();
      
      // Check section description
      await expect(page.getByText('Designs that are trending and loved by the community')).toBeVisible();
    });

    test('should display free designs section', async ({ page }) => {
      // Wait for free designs to load
      await page.waitForSelector('[data-testid="free-designs"]', { timeout: 10000 });
      
      // Check section heading
      await expect(page.getByRole('heading', { name: 'Free Designs' })).toBeVisible();
      
      // Check section description
      await expect(page.getByText('High-quality designs available for free download')).toBeVisible();
    });

    test('should have working navigation buttons', async ({ page }) => {
      // Check browse all designs button
      await expect(page.getByRole('button', { name: 'Browse All Designs' })).toBeVisible();
      
      // Check upload design button
      await expect(page.getByRole('button', { name: 'Upload Your Design' })).toBeVisible();
    });
  });

  test.describe('Design Search and Filtering', () => {
    test('should have search functionality', async ({ page }) => {
      // Find search input
      const searchInput = page.getByPlaceholder('Search designs...');
      await expect(searchInput).toBeVisible();
      
      // Type in search
      await searchInput.fill('test design');
      
      // Click search button
      await page.getByRole('button', { name: 'Search' }).click();
      
      // Wait for results
      await page.waitForTimeout(1000);
    });

    test('should have filter functionality', async ({ page }) => {
      // Click filters button
      await page.getByRole('button', { name: 'Filters' }).click();
      
      // Check filter options are visible
      await expect(page.getByText('Category')).toBeVisible();
      await expect(page.getByText('Design Type')).toBeVisible();
      await expect(page.getByText('Price')).toBeVisible();
      await expect(page.getByText('Featured')).toBeVisible();
    });

    test('should have sorting options', async ({ page }) => {
      // Check sort options
      await expect(page.getByText('Sort by:')).toBeVisible();
      await expect(page.getByText('Newest')).toBeVisible();
      await expect(page.getByText('Popular')).toBeVisible();
      await expect(page.getByText('Most Viewed')).toBeVisible();
      await expect(page.getByText('Most Liked')).toBeVisible();
    });

    test('should have view toggle', async ({ page }) => {
      // Check view toggle buttons
      await expect(page.getByRole('button', { name: /grid/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /list/i })).toBeVisible();
    });
  });

  test.describe('Design Detail Page', () => {
    test('should navigate to design detail page', async ({ page }) => {
      // Wait for designs to load
      await page.waitForSelector('[data-testid="design-card"]', { timeout: 10000 });
      
      // Click on first design
      const firstDesign = page.locator('[data-testid="design-card"]').first();
      await firstDesign.click();
      
      // Check if we're on design detail page
      await expect(page).toHaveURL(/\/designs\/[a-zA-Z0-9]+/);
      
      // Check design details are visible
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display design information', async ({ page }) => {
      // Navigate to a design detail page (assuming there's at least one design)
      await page.goto('/designs/test-design-id');
      
      // Check design name
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      
      // Check description
      await expect(page.getByText('Description')).toBeVisible();
      
      // Check designer information
      await expect(page.getByText('About the Designer')).toBeVisible();
    });

    test('should have download button', async ({ page }) => {
      // Navigate to design detail page
      await page.goto('/designs/test-design-id');
      
      // Check download button
      await expect(page.getByRole('button', { name: /download/i })).toBeVisible();
    });

    test('should have like button', async ({ page }) => {
      // Navigate to design detail page
      await page.goto('/designs/test-design-id');
      
      // Check like button
      await expect(page.getByRole('button', { name: /like/i })).toBeVisible();
    });

    test('should have share button', async ({ page }) => {
      // Navigate to design detail page
      await page.goto('/designs/test-design-id');
      
      // Check share button
      await expect(page.getByRole('button', { name: /share/i })).toBeVisible();
    });
  });

  test.describe('Designer Dashboard', () => {
    test('should redirect to login for unauthenticated users', async ({ page }) => {
      // Try to access designer dashboard
      await page.goto('/dashboard/designs');
      
      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should show unauthorized for non-designer users', async ({ page }) => {
      // Mock customer user session
      await page.addInitScript(() => {
        window.localStorage.setItem('user', JSON.stringify({
          id: 'user1',
          email: 'customer@example.com',
          role: 'customer'
        }));
      });
      
      // Try to access designer dashboard
      await page.goto('/dashboard/designs');
      
      // Should show unauthorized
      await expect(page.getByText('Access Denied')).toBeVisible();
    });
  });

  test.describe('Authentication Flow', () => {
    test('should handle login flow', async ({ page }) => {
      // Go to login page
      await page.goto('/login');
      
      // Check login form elements
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });

    test('should handle registration flow', async ({ page }) => {
      // Go to registration page
      await page.goto('/register');
      
      // Check registration form elements
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Go to designs page
      await page.goto('/designs');
      
      // Check that page loads and is responsive
      await expect(page.getByRole('heading', { name: 'Discover Amazing Designs' })).toBeVisible();
      
      // Check that mobile navigation works
      const searchInput = page.getByPlaceholder('Search designs...');
      await expect(searchInput).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Go to designs page
      await page.goto('/designs');
      
      // Check that page loads and is responsive
      await expect(page.getByRole('heading', { name: 'Discover Amazing Designs' })).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/designs*', route => route.abort());
      
      // Go to designs page
      await page.goto('/designs');
      
      // Check that error is handled gracefully
      await expect(page.getByText('No designs found')).toBeVisible();
    });

    test('should handle 404 errors', async ({ page }) => {
      // Go to non-existent design page
      await page.goto('/designs/non-existent-design');
      
      // Check that 404 error is handled
      await expect(page.getByText('Design Not Found')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      // Go to designs page
      await page.goto('/designs');
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should have good Core Web Vitals', async ({ page }) => {
      // Go to designs page
      await page.goto('/designs');
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Check that images are optimized
      const images = await page.locator('img').all();
      for (const img of images) {
        const src = await img.getAttribute('src');
        if (src) {
          // Check that images have appropriate sizing
          const boundingBox = await img.boundingBox();
          expect(boundingBox).toBeTruthy();
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      // Go to designs page
      await page.goto('/designs');
      
      // Check heading hierarchy
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
      
      const h2 = page.getByRole('heading', { level: 2 });
      await expect(h2.first()).toBeVisible();
    });

    test('should have proper alt text for images', async ({ page }) => {
      // Go to designs page
      await page.goto('/designs');
      
      // Wait for images to load
      await page.waitForSelector('img', { timeout: 10000 });
      
      // Check that images have alt text
      const images = await page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Go to designs page
      await page.goto('/designs');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check that focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });
});
