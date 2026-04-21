import { test, expect } from '@playwright/test';

test.describe('PWA installability', () => {
  test('manifest and icons are served with correct content', async ({ page, request }) => {
    await page.goto('/');

    // <link rel="manifest"> is present
    const manifestHref = await page.getAttribute('link[rel="manifest"]', 'href');
    expect(manifestHref).toBeTruthy();

    // theme-color meta
    const themeColor = await page.getAttribute('meta[name="theme-color"]', 'content');
    expect(themeColor).toBe('#0F3B3A');

    // apple-touch-icon link
    const appleTouch = await page.getAttribute('link[rel="apple-touch-icon"]', 'href');
    expect(appleTouch).toBeTruthy();

    // fetch the manifest
    const res = await request.get(manifestHref!);
    expect(res.ok()).toBe(true);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toMatch(/application\/manifest\+json|application\/json/);
    const manifest = await res.json();
    expect(manifest.name).toBe('Industropoly');
    expect(manifest.short_name).toBe('Industropoly');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(Array.isArray(manifest.icons)).toBe(true);
    const hasMaskable = manifest.icons.some((i: { purpose?: string }) =>
      (i.purpose ?? '').includes('maskable'),
    );
    expect(hasMaskable).toBe(true);

    // icons resolve
    for (const icon of manifest.icons) {
      const iconRes = await request.get(icon.src.startsWith('/') ? icon.src : `/${icon.src}`);
      expect(iconRes.ok(), `icon ${icon.src}`).toBe(true);
    }
    const appleRes = await request.get(appleTouch!);
    expect(appleRes.ok()).toBe(true);
  });

  test('service worker registers and intro screen renders when offline after first visit', async ({
    page,
    context,
  }) => {
    await page.goto('/');
    // wait for the SW to control the page (production preview)
    await page.waitForFunction(
      () => navigator.serviceWorker && navigator.serviceWorker.controller !== null,
      null,
      { timeout: 10_000 },
    );

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Industropoly' })).toBeVisible({
      timeout: 10_000,
    });
    await context.setOffline(false);
  });
});
