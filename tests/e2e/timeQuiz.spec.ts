import { test, expect, Page } from '@playwright/test';

// Defaults to the live site, same as weatherApp.spec.ts. Point it at a local
// server instead with e.g. TIME_QUIZ_URL=http://localhost:8080/FPL/vannilaWeatherApp/weatherGame/timeQuiz.html
const TIME_QUIZ_URL =
  process.env.TIME_QUIZ_URL ??
  'https://tenforben.github.io/FPL/vannilaWeatherApp/weatherGame/timeQuiz.html';

const QUESTION_COUNT = 15;
const NICKNAME = 'Playwright Test';
// Pause between typing a city and clicking Submit, so each answer is visible
// in headed/debug runs. Counts against the question's 20s clock.
const SUBMIT_DELAY_MS = 2000;

// Spread across every continent and climate so a random pick has a fair
// chance of matching either an "above" or a "below" threshold.
const CITY_POOL = [
  'London', 'Paris', 'Berlin', 'Madrid', 'Rome', 'Oslo', 'Stockholm', 'Helsinki', 'Reykjavik', 'Dublin',
  'Lisbon', 'Athens', 'Vienna', 'Warsaw', 'Prague', 'Moscow', 'Istanbul', 'Cairo', 'Nairobi', 'Lagos',
  'Accra', 'Casablanca', 'Johannesburg', 'Cape Town', 'Addis Ababa', 'Dubai', 'Riyadh', 'Tehran', 'Karachi', 'Mumbai',
  'Delhi', 'Chennai', 'Kolkata', 'Dhaka', 'Kathmandu', 'Colombo', 'Bangkok', 'Hanoi', 'Singapore', 'Jakarta',
  'Manila', 'Beijing', 'Shanghai', 'Seoul', 'Tokyo', 'Ulaanbaatar', 'Sydney', 'Melbourne', 'Perth', 'Auckland',
  'Wellington', 'Anchorage', 'Vancouver', 'Toronto', 'Montreal', 'New York', 'Chicago', 'Denver', 'Los Angeles', 'Miami',
  'Mexico City', 'Havana', 'Bogota', 'Lima', 'Quito', 'Santiago', 'Buenos Aires', 'Montevideo', 'Sao Paulo', 'Rio de Janeiro',
  'Ushuaia', 'Nuuk', 'Yellowknife', 'Honolulu', 'Fairbanks', 'Murmansk', 'Yakutsk', 'Novosibirsk', 'Almaty', 'Tashkent',
];

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Submits random cities until the question resolves. A not-found city, one
// already used this quiz, or one on cooldown only shows a hint and keeps the
// question open, so the loop just tries the next city. If the 20s clock runs
// out first, the result screen appears on its own and the loop stops.
async function answerQuestion(page: Page, cities: string[]) {
  const result = page.locator('#tqResult');
  const input = page.locator('#tqCityInput');

  while (!(await result.isVisible())) {
    const city = cities.pop();
    if (!city) throw new Error('Ran out of cities in CITY_POOL');

    try {
      await input.fill(city, { timeout: 2000 });
      await page.waitForTimeout(SUBMIT_DELAY_MS);
      await page.locator('#tqSubmitBtn').click({ timeout: 2000 });
    } catch {
      continue; // question timed out mid-typing; the loop condition sees the result screen
    }

    // Either the result screen shows, or the submit button is enabled again
    // (lookup finished with a hint and the question is still open).
    await page.waitForFunction(() => {
      const resultEl = document.getElementById('tqResult');
      const submit = document.getElementById('tqSubmitBtn') as HTMLButtonElement | null;
      return (resultEl && resultEl.style.display !== 'none') || (submit && !submit.disabled);
    });

    if (!(await result.isVisible())) {
      console.log(`    tried ${city}: ${await page.locator('#tqHint').textContent()}`);
    }
  }
}

test.describe('Time Quiz — World stage', () => {
  test('answers all 15 questions with random cities', async ({ page }) => {
    // 15 questions × up to 20s each, plus lookups.
    test.setTimeout(8 * 60 * 1000);

    // Runs are written to the real Firestore leaderboard, history and
    // Insights, so give them a recognisable nickname instead of a random
    // placeholder (filter on it in the console to find or delete them).
    await page.addInitScript((name) => {
      localStorage.setItem('geoStreakGame_nickname', name);
    }, NICKNAME);

    await page.goto(TIME_QUIZ_URL);

    // World is stage 0, which is always unlocked.
    await page.locator('input[name="tqStagePick"][value="0"]').check();
    await page.locator('#tqStartBtn').click();

    const cities = shuffled(CITY_POOL);

    for (let i = 1; i <= QUESTION_COUNT; i++) {
      await expect(page.locator('#tqQuestion .tq-progress')).toHaveText(`Question ${i} / ${QUESTION_COUNT}`);
      const condition = await page.locator('.tq-condition-text').textContent();

      await answerQuestion(page, cities);

      const badge = await page.locator('.tq-result-badge').textContent();
      const detail = await page.locator('#tqResult .tq-result-detail').textContent();
      console.log(`Q${i}: ${condition?.trim()} → ${badge} (${detail})`);

      // Skip the 5–10s gap between questions.
      await page.locator('#tqNextBtn').click();
    }

    await expect(page.locator('#tqFinal').getByRole('heading', { name: 'Quiz complete' })).toBeVisible();
    await expect(page.locator('#tqFinal .tq-breakdown tbody tr')).toHaveCount(QUESTION_COUNT);
    console.log(`Final: ${await page.locator('.tq-final-score').textContent()} — ${await page.locator('.tq-final-sub').textContent()}`);  });
});
