// Runs `fn` over `items` with at most `limit` in flight at once — enough
// parallelism to scrape a league in seconds instead of minutes (the old
// Selenium version's Thread.Sleep(3000) between every single manager),
// without hammering FPL's API with one request per manager all at once.
export async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
