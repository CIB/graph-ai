import { getChatCompletion } from '../gpt/gpt';
import { parseJSONResponse } from '../gpt/parse-response';
import { DocumentChunk } from '../knowledge/document-chunk';
import { QueryBuilder } from '../query-builder/query-builder';
import { SummarizedDocument } from './conversation';

function buildQueryForInitialQuestion(
  q: QueryBuilder,
  question: string,
  context: SummarizedDocument[],
): void {
  q.selectBlock('description')
    .p('You are the AI assistant. The user has asked the following question:')
    .n()
    .p(question);

  q.selectBlock('context')
    .p(
      'A similarity search for this question in the document store yielded the following results (document contents summarized):',
    )
    .n()
    // Since we're feeding the data to an AI, normally we don't need to format the JSON
    .p(JSON.stringify(context.map((c) => ({ source: c.document.source, summary: c.summary }))));

  q.selectBlock('question')
    .p(
      'Please select the next action to take to answer the question. Provide the answer in one of the following JSON formats:',
    )
    .n()
    .p(
      '1. { "answer-direct": true } - Provide the answer directly only based on the given context.',
    )
    .p(
      '2. { "similarity-search": "query terms" } - Perform a similarity search with the given search terms on the document store to retrieve more context.',
    );
}

function buildGetAnswerForInitialQuestion(
  q: QueryBuilder,
  question: string,
  context: SummarizedDocument[],
): void {
  q.selectBlock('description')
    .p('You are the AI assistant. The user has asked the following question:')
    .n()
    .p(question);

  q.selectBlock('context')
    .p(
      'A similarity search for this question in the document store yielded the following results (document contents summarized):',
    )
    .n()
    // Since we're feeding the data to an AI, normally we don't need to format the JSON
    .p(JSON.stringify(context.map((c) => ({ source: c.document.source, summary: c.summary }))));

  q.selectBlock('question')
    .p(
      'Please provide an answer to the question that can be relayed to the user. Give the answer in the following JSON format.',
    )
    .n()
    .p('{ "answer": "The answer to the question as the user should see it" }');
}

export interface AnswerDirect {
  'answer-direct': true;
}

export interface SimilaritySearch {
  'similarity-search': string;
}

export type NextAction = AnswerDirect | SimilaritySearch;

export async function initialQuestionQuery(
  question: string,
  context: SummarizedDocument[],
): Promise<NextAction> {
  const q = new QueryBuilder();
  buildQueryForInitialQuestion(q, question, context);

  const response = await getChatCompletion(q.toString());
  const nextAction = parseJSONResponse(response) as NextAction;

  return nextAction;
}

export async function getAnswerForInitialQuestion(
  question: string,
  context: SummarizedDocument[],
): Promise<string> {
  const q = new QueryBuilder();
  buildGetAnswerForInitialQuestion(q, question, context);

  const response = await getChatCompletion(q.toString());
  const nextAction = parseJSONResponse(response) as { answer: string };

  return nextAction.answer;
}
