import { sleep } from './sleep';

export async function retry<T>(
  callback: () => Promise<T>,
  maxRetries: number = 10,
  delayDuration: number = 1000,
): Promise<T> {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      return await callback();
    } catch (error) {
      console.error(`Attempt ${attempts + 1} failed with error:`, error);
      attempts++;

      if (attempts < maxRetries) {
        // Grow the sleep time exponentially to avoid overloading the API
        await sleep(attempts * attempts * delayDuration);
      }
    }
  }

  throw new Error('Max retries reached.');
}
