import { test, expect } from '@playwright/test';

const WEATHER_APP_URL = 'https://tenforben.github.io/FPL/vannilaWeatherApp/index.html';

test.describe('Weather app search', () => {
  test('a valid location returns weather details', async ({ page }) => {
    await page.goto(WEATHER_APP_URL);

    // The app auto-loads a default city on page load; wait for that first
    // render to settle so it can't race with (and clobber) our own search.
    await expect(page.locator('#placeName')).toBeVisible();

    await page.locator('#searchUser').fill('London');
    await page.locator('#submit').click();

    await expect(page.locator('#placeName')).toHaveText('London');
    await expect(page.locator('#cuwt')).toContainText('°C');
    await expect(page.locator('.alert-danger')).toHaveCount(0);
  });

  test('an invalid location shows an error instead of weather details', async ({ page }) => {
    await page.goto(WEATHER_APP_URL);

    await expect(page.locator('#placeName')).toBeVisible();

    await page.locator('#searchUser').fill('asdkjhaskjdhqwerty12345');
    await page.locator('#submit').click();

    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('.alert-danger')).toContainText(/not found/i);
    await expect(page.locator('#placeName')).toHaveCount(0);
  });
});
