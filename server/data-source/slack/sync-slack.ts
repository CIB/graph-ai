import 'dotenv/config';
import { SourceDocument, documentStore } from '~/server/knowledge/chroma';
import {
  fetchSlackThreads,
  fetchSlackThreadsBypassCache,
  threadMessageToText,
} from './slack-thread';

async function syncConfluence() {
  const channels = ['C064W5DS6LC', 'C067JCBN47K'];

  for (const channel of channels) {
    const slackThreads = await fetchSlackThreadsBypassCache(channel, 10000);

    // First we handle messages that are "loose" (no thread)
    const looseMessages = slackThreads
      .filter((thread) => thread.messages.length === 1)
      .map((thread) => thread.messages[0]);

    // Convert all messages into a single string
    const looseMessagesText = looseMessages
      .map((message) => threadMessageToText(message))
      .join('\n');

    const document: SourceDocument = {
      source: `slack:${channel}`,
      text: looseMessagesText,
    };
    await documentStore.addDocument(document);

    // Next we handle messages that are part of a thread
    const threadMessages = slackThreads
      .filter((thread) => thread.messages.length > 1)
      .map((thread) => thread.messages);

    for (const messages of threadMessages) {
      const threadText = messages.map((message) => threadMessageToText(message)).join('\n');
      const document: SourceDocument = {
        source: `slack:${channel}:${messages[0].timestamp}`,
        text: threadText,
      };
      await documentStore.addDocument(document);
    }
  }
}

async function main() {
  await documentStore.init();
  await syncConfluence();
  // console.log(await documentStore.searchWithSimilarityScore('Eric'));
}

void main();
