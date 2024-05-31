import 'dotenv/config';
import { getPages } from './getPages';
import {
  ChromaKnowledgeStore,
  SourceDocument,
  documentStore,
} from '../../../server/knowledge/chroma';

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

export async function syncConfluence() {
  await documentStore.init();

  const pages = await getPages(); // Retrieve the pages

  for (const page of pages) {
    const sanitizedTitle = sanitizeFilename(page.title);
    const content = page.body.storage.value;

    console.log('document', sanitizedTitle, content.slice(0, 100));

    const document: SourceDocument = {
      source: `confluence:${sanitizedTitle}.txt`,
      text: content,
    };

    await documentStore.addDocument(document);
  }
}
