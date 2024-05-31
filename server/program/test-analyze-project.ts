import { Subject } from 'rxjs';
import { Conversation } from '../conversation/conversation';
import { documentStore } from '../knowledge/chroma';
import { summarizeDirectory } from '../file/analyze-project';

async function main() {
  const projectRoot = '/home/christian/katon';
  await summarizeDirectory(projectRoot);
}

void main();
