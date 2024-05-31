import { getChatCompletion } from '../gpt/gpt';
import { parseJSONResponse } from '../gpt/parse-response';
import { QueryBuilder } from '../query-builder/query-builder';
import { SummarizedDocument } from './conversation';

function buildQueryForConversationClarifications(
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
      'Please create a list of terms from the question that are essential to understanding the question correctly. Avoid terms if defining this term would already answer the user question. Respond in the following JSON format where relevance can be one of "high", "medium", "low":',
    )
    .n()
    .p(
      '{ "terms": [{"term": "helper function", "relevance": "high"}, {"term": "web application", "relevance": "medium"}] }',
    );
}

export interface ClarificationQuestions {
  terms: { term: string; relevance: 'high' | 'medium' | 'low' }[];
}

export async function queryConservationClarifications(
  question: string,
  context: SummarizedDocument[],
): Promise<ClarificationQuestions> {
  const q = new QueryBuilder();
  buildQueryForConversationClarifications(q, question, context);

  const response = await getChatCompletion(q.toString());
  const clarificationQuestions = parseJSONResponse(response);

  return clarificationQuestions;
}

function buildQueryForConversationContext(
  q: QueryBuilder,
  question: string,
  term: string,
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

  q.selectBlock('clarification')
    .p(
      'To better answer the question, please use the given context to clarify what is meant in the question by the given term. Try to stick to 200 characters or less: ',
    )
    .p(term);

  q.selectBlock('question')
    .p('Please provide the meaning of the term in the following JSON format:')
    .n()
    .p('{ "answer": "Meaning of the term in the context of the question." }');
}

export interface ContextResponse {
  context: string;
}

export async function conversationContextQuery(
  question: string,
  clarification: string,
  context: SummarizedDocument[],
): Promise<ContextResponse> {
  const q = new QueryBuilder();
  buildQueryForConversationContext(q, question, clarification, context);

  const response = await getChatCompletion(q.toString());
  const contextResponse = parseJSONResponse(response);

  return contextResponse;
}
