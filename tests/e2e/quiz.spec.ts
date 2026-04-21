import { test, expect } from '@playwright/test';

// HUD inspection (the "Info" button) should always show the standalone
// TileInfoModal — never the QuestionModal — regardless of game state. This
// is the out-of-turn educational path and must not start a quiz.
test('HUD info button mostra modal informativo sem disparar quiz', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Começar' }).click();
  await page.getByRole('button', { name: 'Iniciar Jogo' }).click();

  // Click the "Info" button while still on the starting tile (awaiting-roll).
  await page.getByRole('button', { name: /Info/i }).click();

  // The standalone tile-info modal opens. The quiz modal must NOT appear.
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Responder' })).toHaveCount(0);
});

// The hint shop reduces cash and persists revealed hints when a quiz is open.
// We can't deterministically force a tile via UI, so this test is best-effort:
// it rolls, and if a quiz appears, it verifies the hint shop is rendered with
// at least one hint button. If a corner skips the quiz, the test no-ops.
test('quiz: a loja de dicas é renderizada se a pergunta abrir', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Começar' }).click();
  await page.getByRole('button', { name: 'Iniciar Jogo' }).click();

  await page.getByRole('button', { name: /Lançar/ }).click();

  const responder = page.getByRole('button', { name: 'Responder' });
  await responder.waitFor({ timeout: 8000 }).catch(() => undefined);
  if (!(await responder.isVisible().catch(() => false))) {
    test.skip(true, 'Landing pulou o quiz (canto). Cobertura por testes unitários.');
  }

  // Hint shop section is labeled "Loja de Dicas". At least one hint button
  // ("£X" suffix) should be present.
  await expect(page.getByText('Loja de Dicas')).toBeVisible();
  const hintButtons = page.locator('button', { hasText: /£\d+/ });
  expect(await hintButtons.count()).toBeGreaterThan(0);
});
