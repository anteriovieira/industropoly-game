import { test, expect } from '@playwright/test';

test('intro -> setup -> jogo, lança dados e encerra turno', async ({ page }) => {
  await page.goto('/');

  // Tela de introdução
  await expect(page.getByRole('heading', { name: 'Industropoly' })).toBeVisible();
  await page.getByRole('button', { name: 'Começar' }).click();

  // Setup
  await expect(page.getByRole('heading', { name: /Reúna os Investidores/i })).toBeVisible();
  // 2 jogadores vêm pré-selecionados com tokens distintos por padrão.
  await page.getByRole('button', { name: 'Iniciar Jogo' }).click();

  // Jogo: o HUD deve mostrar o botão de lançamento.
  await expect(page.getByRole('button', { name: /Lançar/ })).toBeVisible();
  await page.getByRole('button', { name: /Lançar/ }).click();

  // Aguarda o modal de aterrissagem abrir e clica em Recusar/Continuar.
  const recusar = page.getByRole('button', { name: 'Recusar' });
  const continuar = page.getByRole('button', { name: 'Continuar' });
  await Promise.race([
    recusar.waitFor({ timeout: 8000 }).catch(() => undefined),
    continuar.waitFor({ timeout: 8000 }).catch(() => undefined),
  ]);
  if (await recusar.isVisible().catch(() => false)) await recusar.click();
  else if (await continuar.isVisible().catch(() => false)) await continuar.click();

  // Encerrar turno.
  await page.getByRole('button', { name: /Encerrar turno/ }).click();
});
