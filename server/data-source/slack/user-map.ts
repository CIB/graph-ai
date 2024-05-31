import { Dictionary } from 'lodash';
import { getSlackUserName } from './get-username';

const nameMap: Dictionary<string> = {};

export async function getUsername(userId: string): Promise<string> {
  if (userId in nameMap) {
    return nameMap[userId];
  } else {
    const username = await getSlackUserName(userId);
    nameMap[userId] = username;
    console.log('user', userId, username);
    return username;
  }
}
