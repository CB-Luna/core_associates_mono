import { test as setup, expect } from '@playwright/test';
import path from 'path';

export const STORAGE_STATE = path.join(__dirname, '..', '.auth', 'admin.json');

/**
 * Global setup: login via UI once and save auth state (localStorage + cookies).
 * All subsequent tests reuse this state.
 */
setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');

  // Click the Admin preset card to fill credentials
  await page.click('button:has-text("Administrador")');
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  expect(page.url()).toContain('/dashboard');

  // Save storage state (includes localStorage with tokens)
  await page.context().storageState({ path: STORAGE_STATE });
});
