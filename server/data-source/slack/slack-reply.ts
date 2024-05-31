import { SlackMessage } from './slack-reply.interface';
import { getUsername } from './user-map';

export interface ConversationReaction {
  user: string;
  reaction: string;
}

export interface ConversationImage {
  name: string;
  link: string;
}

export interface ConversationMessage {
  user: string;
  text: string;
  reactions: ConversationReaction[];
  images: ConversationImage[];
  timestamp: string;
}

async function replaceMentionsWithUsernames(text: string): Promise<string> {
  const mentionPattern = /<@(.*?)>/g;
  let result = text;

  let match;
  while ((match = mentionPattern.exec(text)) !== null) {
    const userId = match[1];
    const username = await getUsername(userId);
    result = result.replace(`<@${userId}>`, `@[${username}]`);
  }

  return result;
}

export async function parseSlackReply(message: SlackMessage): Promise<ConversationMessage> {
  const userName = await getUsername(message.user);

  const processedReplyText = await replaceMentionsWithUsernames(message.text);

  const reactions: ConversationReaction[] =
    message.reactions?.map((reaction) => ({
      user: reaction.users[0], // This assumes there's always at least one user for a reaction
      reaction: reaction.name,
    })) || [];

  const images: ConversationImage[] =
    message.files?.map((file) => ({
      name: file.name,
      link: file.url_private,
    })) || [];

  for (let i = 0; i < reactions.length; i++) {
    reactions[i].user = await getUsername(reactions[i].user);
  }

  return {
    user: userName,
    text: processedReplyText,
    reactions: reactions,
    images: images,
    timestamp: message.ts,
  };
}
