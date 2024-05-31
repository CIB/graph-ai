import 'dotenv/config';
import { ChromaClient, Collection, OpenAIEmbeddingFunction } from 'chromadb';
import { splitByLine } from './splitter';
import { DocumentChunk } from './document-chunk';

const embedder = new OpenAIEmbeddingFunction({
  openai_api_key: process.env.OPENAI_API_KEY!,
  openai_model: 'text-embedding-3-large',
});

export interface SourceDocument {
  source: string;
  text: string;
}

export interface SearchResult {
  document: DocumentChunk;
  score: number;
}

export class ChromaKnowledgeStore {
  private chroma: ChromaClient;
  private collection!: Collection;

  constructor(public name = 'documents') {
    this.chroma = new ChromaClient({ path: 'http://localhost:8000' });
    void this.init();
  }

  async init() {
    if (this.collection) return;
    try {
      this.collection = await this.chroma.createCollection({
        name: this.name,
        embeddingFunction: embedder,
      });
    } catch (err) {
      try {
        this.collection = await this.chroma.getCollection({
          name: this.name,
          embeddingFunction: embedder,
        });
      } catch (err2) {
        console.error('Could not create collection or fetch existing one', err, err2);
      }
    }
  }

  async addDocument(document: SourceDocument) {
    const chunks = splitByLine(document.text);
    console.log(
      'lengths',
      chunks.map((t) => t.text.length),
    );
    if (!chunks.length) return;
    await this.collection.add({
      ids: chunks.map((text, i) => `${document.source}[${i}]`),
      documents: chunks.map((chunk) => chunk.text),
      metadatas: chunks.map((chunk) => ({
        source: document.source,
        start: chunk.start,
        end: chunk.end,
      })),
    });
  }

  async searchWithSimilarityScore(query: string): Promise<SearchResult[]> {
    const queryData = await this.collection.query({
      queryTexts: [query],
      nResults: 5,
    });

    console.log('queryData', JSON.stringify(queryData, null, 2));
    const result: SearchResult[] = [];
    for (let i = 0; i < queryData.documents[0].length; i++) {
      result.push({
        document: {
          source: queryData.metadatas[0]![i]!.source as string,
          text: queryData.documents[0][i]!,
          start: queryData.metadatas[0]![i]!.start as number,
          end: queryData.metadatas[0]![i]!.end as number,
        },
        score: queryData.distances![0][i],
      });
    }

    return result;
  }
}

export const documentStore = new ChromaKnowledgeStore();
