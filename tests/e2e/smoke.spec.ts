import { test, expect } from '@playwright/test';

// End-to-end smoke that walks through: intro → setup → roll → quiz → answer →
// (optional) buy/decline → end turn. The flow is non-deterministic w.r.t. which
// tile and question come up, so we drive it by interaction primitives rather
// than by specific tile content.
test('intro -> setup -> jogo, lança dados, responde pergunta e encerra turno', async ({ page }) => {
  await page.goto('/');

  // Intro
  await expect(page.getByRole('heading', { name: 'Industropoly' })).toBeVisible();
  await page.getByRole('button', { name: 'Começar' }).click();

  // Setup
  await expect(page.getByRole('heading', { name: /Reúna os Investidores/i })).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar Jogo' }).click();

  // Roll
  await expect(page.getByRole('button', { name: /Jogar/ })).toBeVisible();
  await page.getByRole('button', { name: /Jogar/ }).click();

  // Quiz: pick first option, submit, then continue past the result panel.
  // Note: corner landings (rare) skip the quiz; we tolerate either.
  const responder = page.getByRole('button', { name: 'Responder' });
  // "Próximo:" appears in the turn Parchment once the turn reaches the
  // awaiting-end-turn phase. Used as a sentinel for that state.
  const endTurnSentinel = page.getByText(/Próximo:/);

  await Promise.race([
    responder.waitFor({ timeout: 8000 }).catch(() => undefined),
    endTurnSentinel.waitFor({ timeout: 8000 }).catch(() => undefined),
  ]);

  if (await responder.isVisible().catch(() => false)) {
    // Click the first available option, then submit, then continue past result.
    await page.locator('input[type="radio"][name="quiz-option"]').first().check();
    await responder.click();
    await page.getByRole('button', { name: 'Continuar' }).click();
  }

  // After quiz: a buy offer (Recusar/Comprar) may appear (correct answer on
  // unowned tile). On wrong answer or owned/no-rule tile, we go straight to
  // end-turn.
  const recusar = page.getByRole('button', { name: 'Recusar' });
  const continuar = page.getByRole('button', { name: 'Continuar' });
  await Promise.race([
    recusar.waitFor({ timeout: 4000 }).catch(() => undefined),
    continuar.waitFor({ timeout: 4000 }).catch(() => undefined),
    endTurnSentinel.waitFor({ timeout: 4000 }).catch(() => undefined),
  ]);
  if (await recusar.isVisible().catch(() => false)) await recusar.click();
  else if (await continuar.isVisible().catch(() => false)) await continuar.click();

  // End turn via the combined Jogar button — in awaiting-end-turn it ends
  // the current turn and auto-rolls for the next player.
  await endTurnSentinel.waitFor({ timeout: 4000 });
  await page.getByRole('button', { name: /Lançar →/ }).click();
});
