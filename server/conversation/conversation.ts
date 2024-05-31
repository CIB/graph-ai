import { SearchResult, documentStore } from '../knowledge/chroma';
import { DocumentChunk } from '../knowledge/document-chunk';
import {
  conversationContextQuery,
  queryConservationClarifications,
} from './conversation-context.query';
import { getAnswerForInitialQuestion, initialQuestionQuery } from './initial-question.query';
import { summarizeDocumentQuery } from './summarize-document.query';
import { Subject } from 'rxjs';

export interface UserMessageHistoryItem {
  type: 'user-message';
  message: string;
}

export interface DocumentQueryHistoryItem {
  type: 'document-query';
  query: string;
  results: string[];
}

export interface BotReplyItem {
  type: 'bot-reply';
  message: string;
}

export type ConversationHistoryItem =
  | UserMessageHistoryItem
  | DocumentQueryHistoryItem
  | BotReplyItem;

export interface SummarizedDocument {
  document: DocumentChunk;
  score: number;
  summary: string;
}

async function summarizeDocuments(
  query: string,
  searchResults: SearchResult[],
): Promise<SummarizedDocument[]> {
  return (
    await Promise.all(
      searchResults.map(async (searchResult) => {
        const result = await summarizeDocumentQuery(query, searchResult.document);
        if ('skip' in result) {
          return null;
        } else {
          return {
            document: searchResult.document,
            score: searchResult.score,
            summary: result.summary,
          };
        }
      }),
    )
  ).filter((item) => !!item) as SummarizedDocument[];
}

export class Conversation {
  history: ConversationHistoryItem[] = [];

  constructor(public events$: Subject<string>) {}

  async query(query: string): Promise<string> {
    this.history.push({
      type: 'user-message',
      message: query,
    });

    // Retrieve the context based on the query
    const searchResults = (await documentStore.searchWithSimilarityScore(query)).slice(0, 5);

    const summaries = await summarizeDocuments(query, searchResults);

    for (const summary of summaries) {
      this.events$.next(
        JSON.stringify({
          title: summary.document.source,
          context: summary.summary,
        }),
      );
    }

    // Now we get the next action
    const nextAction = await initialQuestionQuery(query, summaries);

    if ('answer-direct' in nextAction) {
      const answer = await getAnswerForInitialQuestion(query, summaries);
      console.log('Answer:', answer);
      return answer;
    } else {
      let newResults = (
        await documentStore.searchWithSimilarityScore(nextAction['similarity-search'])
      ).slice(0, 5);

      // Check if any of the new results are already in the context
      newResults = newResults.filter(
        (result) => !summaries.some((s) => s.document.source === result.document.source),
      );

      // Add the new results to the context
      const newSummaries = await summarizeDocuments(query, newResults);
      summaries.push(...newSummaries);

      const answer = await getAnswerForInitialQuestion(query, summaries);
      console.log('Answer:', answer);
      return answer;
    }
  }
}
