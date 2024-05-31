import { promises as fs } from 'fs';
import { ConversationMessage, parseSlackReply } from './slack-reply';
import { SlackMessage } from './slack-reply.interface';
import { sleep } from '~/server/utils/sleep';

const token = process.env.SLACK_TOKEN!;

export interface SlackThread {
  timestamp: string;
  messages: ConversationMessage[];
}

// Initialize
export async function fetchSlackConversationHistory(
  channel: string,
  cursor: string,
  limit: number,
): Promise<any> {
  const url = 'https://slack.com/api/conversations.history';
  const params = {
    token,
    channel,
    cursor,
    limit,
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const result = (await response.json()) as any;

  if (!result.ok) {
    throw new Error(result.error);
  }

  return result;
}

export async function fetchAllSlackThreadReplies(
  channel: string,
  ts: string,
): Promise<SlackMessage[]> {
  const limit = 100; // Set your desired limit
  let cursor;
  const allReplies = [];

  const boundary = '-----------------------------' + Math.random().toString().substr(2);

  while (true) {
    let body = `--${boundary}\r\nContent-Disposition: form-data; name="token"\r\n\r\n${token}\r\n`;
    body += `--${boundary}\r\nContent-Disposition: form-data; name="channel"\r\n\r\n${channel}\r\n`;
    body += `--${boundary}\r\nContent-Disposition: form-data; name="ts"\r\n\r\n${ts}\r\n`;
    body += `--${boundary}\r\nContent-Disposition: form-data; name="limit"\r\n\r\n${limit}\r\n`;
    if (cursor) {
      body += `--${boundary}\r\nContent-Disposition: form-data; name="cursor"\r\n\r\n${cursor}\r\n`;
    }
    body += `--${boundary}--\r\n`;

    const response = await fetch('https://slack.com/api/conversations.replies', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = (await response.json()) as any;

    if (!result.ok) {
      throw new Error(result.error);
    }

    allReplies.push(...result.messages);

    if (!result.response_metadata || !result.response_metadata.next_cursor) {
      break;
    }

    cursor = result.response_metadata.next_cursor;
  }

  return allReplies as SlackMessage[];
}

export function threadMessageToText(message: ConversationMessage): string {
  let result = `${message.user}: ${message.text}`;
  if (message.images.length === 1) {
    result += `\n[Attached image: ${message.images[0].link}]`;
  } else if (message.images.length > 1) {
    result += `\n[Attached images: ${message.images.map((image) => image.link).join(',')}]`;
  }

  for (const reaction of message.reactions) {
    result += `\n[Reaction {${reaction.reaction}} from ${reaction.user}]`;
  }

  return result;
}

export function threadToText(messages: ConversationMessage[]): string {
  return messages.map(threadMessageToText).join('\n');
}

export async function fetchSlackThreadsBypassCache(
  channel: string,
  limit: number,
): Promise<SlackThread[]> {
  let cursor;
  const threads = [];

  while (true) {
    await sleep(2000);
    const result = await fetchSlackConversationHistory(channel, cursor, limit);
    const messages = result.messages;
    cursor = result.response_metadata.next_cursor;
    console.log('cursor', cursor);

    for (const message of messages) {
      const thread_ts = message.ts; // change this to message.ts
      const threadMessages = {
        timestamp: thread_ts,
        messages: [await parseSlackReply(message)],
      };
      if (!message.thread_ts) {
        threads.push(threadMessages);
        continue;
      }
      await sleep(2000);
      console.log('thread', thread_ts);
      const replies = (await fetchAllSlackThreadReplies(channel, thread_ts)).slice(1); // We skip the first message in the thread as we already have it

      console.log('replies', replies);
      for (let reply of replies) {
        threadMessages.messages.push(await parseSlackReply(reply));
      }
      threads.push(threadMessages);
      console.log('threads.length', threads.length, limit);
      if (threads.length > limit) {
        break;
      }
    }

    if (!cursor || threads.length > limit) {
      break;
    }
  }

  const sanitizedChannelName = sanitizeChannelName(channel);
  await fs.writeFile(
    `./${sanitizedChannelName}_threads.json`,
    JSON.stringify(threads, null, ' '),
    'utf-8',
  );

  return threads;
}

export async function fetchSlackThreads(channel: string, limit: number): Promise<SlackThread[]> {
  const sanitizedChannelName = sanitizeChannelName(channel);
  try {
    const threads = JSON.parse(
      await fs.readFile(`./${sanitizedChannelName}_threads.json`, 'utf-8'),
    );
    return threads;
  } catch (err) {}

  return fetchSlackThreadsBypassCache(channel, limit);
}

function sanitizeChannelName(name: string) {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}
