import type { Dictionary } from 'lodash';

export interface TextWithCitations {
  text: string;
  citations: Dictionary<string>;
}
