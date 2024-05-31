import { Subject } from 'rxjs';
import { Conversation } from '../conversation/conversation';
import { documentStore } from '../knowledge/chroma';

async function main() {
  await documentStore.init();
  const conversation = new Conversation(new Subject());
  await conversation.query('How will bidding be implemented in the system?');
}

void main();
