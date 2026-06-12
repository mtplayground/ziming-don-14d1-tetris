import { expect, test, type Page } from '@playwright/test';

async function hardDropAtSpawnOffset(page: Page, offset: number): Promise<void> {
  const key = offset < 0 ? 'ArrowLeft' : 'ArrowRight';

  for (let step = 0; step < Math.abs(offset); step += 1) {
    await page.keyboard.press(key);
  }

  await page.keyboard.press('Space');
}

test('plays through start, line clear, and game over', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.2;
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ready' })).toBeVisible();

  await page.getByRole('button', { name: 'Start' }).click();

  for (const offset of [-4, -2, 0, 2, 4]) {
    await hardDropAtSpawnOffset(page, offset);
  }

  await expect(page.getByLabel('Lines cleared')).toHaveText('2');
  await expect(page.getByLabel('Current score')).toHaveText('300');

  for (let drop = 0; drop < 10; drop += 1) {
    await page.keyboard.press('Space');
  }

  await expect(page.getByRole('heading', { name: 'Game over' })).toBeVisible();
  await expect(page.getByText('Final run summary.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restart' })).toBeVisible();
});
