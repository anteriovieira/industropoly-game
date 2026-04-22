import { test, expect, chromium } from '@playwright/test';

// Opt-in: this test creates real rows in the configured Supabase project.
// Run with `RUN_SUPABASE_E2E=1 npx playwright test online-multiplayer`.
test.skip(!process.env.RUN_SUPABASE_E2E, 'Set RUN_SUPABASE_E2E=1 to enable');

test('two players can join the same room and start a game', async () => {
  const browserA = await chromium.launch();
  const browserB = await chromium.launch();
  const ctxA = await browserA.newContext();
  const ctxB = await browserB.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4173';

  await pageA.goto(baseURL);
  await pageA.getByRole('button', { name: /sala online/i }).click();
  await pageA.getByRole('textbox').first().fill('Alice');
  await pageA.getByRole('button', { name: /criar sala/i }).click();

  await expect(pageA.getByText(/Código:/i)).toBeVisible({ timeout: 10000 });
  const codeText = await pageA.getByText(/Código:/i).textContent();
  const code = codeText!.match(/[A-Z0-9]{4}-[A-Z0-9]{4}/)![0];

  await pageB.goto(baseURL);
  await pageB.getByRole('button', { name: /sala online/i }).click();
  const inputs = pageB.getByRole('textbox');
  await inputs.first().fill('Bob');
  await inputs.nth(1).fill(code);
  await pageB.getByRole('button', { name: /entrar/i }).click();

  // Bob should appear in Alice's lobby within a couple of poll cycles (2s interval).
  await expect(pageA.getByText(/Bob/)).toBeVisible({ timeout: 8000 });

  await pageA.getByRole('button', { name: /iniciar partida/i }).click();

  // Both should land on the game screen — the 3D canvas indicates GameScreen mounted.
  await expect(pageA.locator('canvas').first()).toBeVisible({ timeout: 15000 });
  await expect(pageB.locator('canvas').first()).toBeVisible({ timeout: 15000 });

  await browserA.close();
  await browserB.close();
});
