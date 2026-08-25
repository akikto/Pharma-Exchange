import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';

const VIEWPORT = { width: 390, height: 844 };

test.describe('login label alignment', () => {
  test.use({ viewport: VIEWPORT });

  test('identifier label and input share the same left edge', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-form').waitFor();

    const metrics = await page.evaluate(() => {
      const label = document.querySelector('label[for="identifier"]');
      const input = document.querySelector('input#identifier');
      const root = document.querySelector('[data-testid="login-page-root"]');
      function snap(el: Element | null, name: string) {
        if (!el) return { name, found: false };
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          name,
          found: true,
          marginLeft: s.marginLeft,
          marginRight: s.marginRight,
          paddingLeft: s.paddingLeft,
          paddingRight: s.paddingRight,
          position: s.position,
          display: s.display,
          width: s.width,
          transform: s.transform,
          rectLeft: r.left,
          rectRight: r.right,
          rectWidth: r.width,
        };
      }
      return {
        root: snap(root, 'root'),
        label: snap(label, 'label'),
        input: snap(input, 'input'),
        labelParent: snap(label?.parentElement ?? null, 'labelParent'),
      };
    });

    mkdirSync('/opt/cursor/artifacts', { recursive: true });
    writeFileSync('/opt/cursor/artifacts/login-alignment-metrics.json', JSON.stringify(metrics, null, 2));

    const label = page.locator('label[for="identifier"]');
    const input = page.locator('input#identifier');

    await label.scrollIntoViewIfNeeded();
    await label.screenshot({ path: '/opt/cursor/artifacts/login-label-element.png' });
    await input.screenshot({ path: '/opt/cursor/artifacts/login-input-element.png' });

    await page.screenshot({
      path: '/opt/cursor/artifacts/login-page-viewport.png',
      fullPage: true,
    });

    expect(metrics.label.found).toBe(true);
    expect(metrics.input.found).toBe(true);
    expect(metrics.root.found).toBe(true);

    const diff = Math.abs((metrics.label.rectLeft as number) - (metrics.input.rectLeft as number));
    // Allow minor subpixel drift on Linux CI fonts (Node 24 runners).
    expect(diff).toBeLessThan(2);
  });
});
