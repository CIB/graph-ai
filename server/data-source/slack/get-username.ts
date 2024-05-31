import { retry } from '~/server/utils/retry';

const token = process.env.SLACK_TOKEN!;

export async function getSlackUserName(userId: string): Promise<string> {
  const url = `https://slack.com/api/users.info?user=${userId}&pretty=1`;
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  return retry(async () => {
    const response = await fetch(url, {
      headers,
      method: 'POST',
    });

    if (response.ok) {
      // if HTTP status is 2xx, then consider it as a successful response.
      const data = (await response.json()) as any;
      return data.user.profile.real_name;
    } else {
      throw new Error(`Failed with status ${response.status}: ${response.statusText}`);
    }
  });
}
