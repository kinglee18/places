/**
 * E2E test: full property registration flow
 *
 * Covers:
 *  - Auth bypass via injected NextAuth session cookie
 *  - All three form steps: Location → Features → Details
 *  - "Next" is blocked until required fields are filled
 *  - Happy path submit shows the success screen
 *  - "Register another property" resets the form
 *  - Photo upload (attaches a real file and verifies preview appears)
 *  - Supabase cleanup: test row deleted after each run
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { injectSession } from './fixtures/auth';
import { createClient } from '@supabase/supabase-js';

// ── Supabase client for cleanup ───────────────────────────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env vars not set');
  return createClient(url, key);
}

test.beforeEach(async ({ context }) => {
  await injectSession(context);
});

test.afterEach(async () => {
  // Remove any test rows left by this run
  await getSupabase()
    .from('properties')
    .delete()
    .eq('user_email', 'playwright@test.local');
});

// ── Happy path ────────────────────────────────────────────────────────────────

test('completes all three steps and shows success screen', async ({ page }) => {
  await page.goto('/registro');
  await expect(page.getByRole('heading', { name: /register your property/i })).toBeVisible();

  // ── Step 1: Location ──────────────────────────────────────────────────────
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'Condesa' }).click();

  await page.getByPlaceholder(/Insurgentes/i).fill('Av. Álvaro Obregón');
  await page.getByPlaceholder(/123/i).fill('42');

  await page.getByRole('button', { name: 'Next →' }).click();

  // ── Step 2: Features ──────────────────────────────────────────────────────
  await expect(page.getByText('Features')).toBeVisible();

  // Property type select
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Corner unit' }).click();

  await page.getByPlaceholder(/45/i).fill('80');
  await page.getByPlaceholder(/10/i).fill('5');

  await page.getByRole('button', { name: 'Next →' }).click();

  // ── Step 3: Details ───────────────────────────────────────────────────────
  await expect(page.getByText('Details')).toBeVisible();

  await page.getByPlaceholder(/describe the property/i).fill('Bright corner unit with great foot traffic');

  // Water & drainage
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Water and drainage complete' }).click();

  // Increment parking to 1
  const parkingCard = page.getByText('PARKING SPACES').locator('..');
  await parkingCard.getByText('+').click();

  // Submit
  await page.getByRole('button', { name: /register property/i }).click();

  // ── Success ───────────────────────────────────────────────────────────────
  await expect(page.getByText('Property registered!')).toBeVisible({ timeout: 10_000 });
});

// ── Photo upload ──────────────────────────────────────────────────────────────

test('attaches a photo and shows a thumbnail preview', async ({ page }) => {
  await page.goto('/registro');

  // Pass step 1
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'Roma Norte' }).click();
  await page.getByRole('button', { name: 'Next →' }).click();

  // Pass step 2
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Street-facing (with storefront)' }).click();
  await page.getByPlaceholder(/45/i).fill('60');
  await page.getByRole('button', { name: 'Next →' }).click();

  // Step 3 — upload a photo
  await expect(page.getByText('PHOTOS')).toBeVisible();

  const fileInput = page.locator('input[type="file"]');
  // Use a small bundled test image (Next.js public favicon is available)
  await fileInput.setInputFiles(path.join(process.cwd(), 'public', 'favicon.ico'));

  // Thumbnail should appear
  await expect(page.locator('img[alt="photo-0"]')).toBeVisible({ timeout: 5_000 });

  // Submit with photo
  await page.getByRole('button', { name: /register property/i }).click();
  await expect(page.getByText('Property registered!')).toBeVisible({ timeout: 15_000 });
});

// ── Validation ────────────────────────────────────────────────────────────────

test('blocks step 1 when no neighborhood is selected', async ({ page }) => {
  await page.goto('/registro');

  await page.getByRole('button', { name: 'Next →' }).click();

  await expect(page.getByText(/neighborhood required/i)).toBeVisible();
  // Form has not advanced — stepper still shows step 1 as active
  await expect(page.getByText(/property type/i)).not.toBeVisible();
});

test('blocks step 2 when required fields are missing', async ({ page }) => {
  await page.goto('/registro');

  // Pass step 1
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'Polanco' }).click();
  await page.getByRole('button', { name: 'Next →' }).click();

  // Try to advance step 2 without filling anything
  await page.getByRole('button', { name: 'Next →' }).click();

  await expect(page.getByText(/type required/i)).toBeVisible();
});

// ── Reset ─────────────────────────────────────────────────────────────────────

test('"Register another property" resets the form', async ({ page }) => {
  await page.goto('/registro');

  // Quick submit
  await page.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'Del Valle' }).click();
  await page.getByRole('button', { name: 'Next →' }).click();

  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Market stall' }).click();
  await page.getByPlaceholder(/45/i).fill('20');
  await page.getByRole('button', { name: 'Next →' }).click();

  await page.getByRole('button', { name: /register property/i }).click();
  await expect(page.getByText('Property registered!')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: /register another/i }).click();

  // Back to blank step-1 form
  await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
  await expect(page.getByText('Property registered!')).not.toBeVisible();
});
