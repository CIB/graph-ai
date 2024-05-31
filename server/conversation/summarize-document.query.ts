import { getChatCompletion } from '../gpt/gpt';
import { parseJSONResponse } from '../gpt/parse-response';
import { DocumentChunk } from '../knowledge/document-chunk';
import { QueryBuilder } from '../query-builder/query-builder';

function buildQueryForSummarizeDocument(
  q: QueryBuilder,
  question: string,
  document: DocumentChunk,
): void {
  q.selectBlock('description')
    .p('You are the AI assistant. The user has asked the following question:')
    .n()
    .p(question);

  q.selectBlock('context')
    .p('In order to answer the question, we are examining the following document:')
    .n()
    .p(`# ${document.source}`)
    // Since we're feeding the data to an AI, normally we don't need to format the JSON
    .p(JSON.stringify(document));

  q.selectBlock('question')
    .p(
      'Please extract (quote) the sections of the text that are pertinent to the question. Use [...] to mark parts of the text that have been skipped. Try to keep the extracted text to below 800 characters. Respond in the following JSON format:',
    )
    .n()
    .p(
      '1. { "summary": "relevant quote [...] more relevant quote" } - Summarized text from the document that is relevant to the question.',
    )
    .p(
      '2. { "skip": true } - Skip this document, as it does not contain information directly related to the question.',
    );
}

export interface DocumentSummary {
  summary: string;
}

export interface SkipSummary {
  skip: true;
}

export type SummaryAction = DocumentSummary | SkipSummary;

export async function summarizeDocumentQuery(
  question: string,
  document: DocumentChunk,
): Promise<SummaryAction> {
  const q = new QueryBuilder();
  buildQueryForSummarizeDocument(q, question, document);

  const response = await getChatCompletion(q.toString());
  const nextAction = parseJSONResponse(response) as SummaryAction;

  return nextAction;
}
