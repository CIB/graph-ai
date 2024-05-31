import { Subject } from 'rxjs';
import { Conversation } from '../conversation/conversation';
import { documentStore } from '../knowledge/chroma';

export default defineEventHandler(async (event) => {
  const { req, res } = event.node;

  const query = getQuery(event);
  const question = query.question as string;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  await documentStore.init();
  const events$ = new Subject<string>();
  events$.subscribe((message) => {
    console.log('writing event', message);
    res.write(`data: ${message}\n\n`);
  });
  const conversation = new Conversation(events$);
  const answer = await conversation.query(question);
  res.write(`data: ${JSON.stringify({ answer })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    res.end();
    events$.complete();
  });
});
