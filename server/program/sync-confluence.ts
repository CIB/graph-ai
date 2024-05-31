import { syncConfluence } from '../data-source/confluence/confluence';
import { documentStore } from '../knowledge/chroma';

export async function main() {
  await syncConfluence();
  console.log(await documentStore.searchWithSimilarityScore('What is the katon project?'));
}

void main();
