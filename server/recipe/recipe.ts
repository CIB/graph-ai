import { Dictionary } from 'lodash';
import { JavaScriptImplementation } from './js-implementation';
import { QueryBuilder } from '../query-builder/query-builder';
import { getOllamaCompletion } from '../gpt/ollama';
import { parseJSONResponse } from '../gpt/parse-response';
import { getChatCompletion } from '../gpt/gpt';

export interface Recipe {
  name: string;
  inputs: string[];
  outputs: string[];
  description: string;
  implementation?: JavaScriptImplementation;
}

export async function evalRecipeLLM(
  recipe: Recipe,
  args: Dictionary<any>,
  model: 'ollama' | 'gpt-4o' = 'ollama',
): Promise<Dictionary<any>> {
  const q = new QueryBuilder();

  q.selectBlock('task').p('Please provide an answer to the following task:').p(recipe.description);

  q.selectBlock('inputs').p('Inputs:').p(JSON.stringify(args));

  q.selectBlock('response')
    .p(`Provide the response in the following JSON format:`)
    .p(`{${recipe.outputs.map((output) => `"${output}": "value"`).join(', ')}}`);

  let response: string;
  if (model === 'ollama') {
    response = await getOllamaCompletion(q.toString());
  } else {
    response = await getChatCompletion(q.toString(), model);
  }
  console.log('response', response);
  return parseJSONResponse(response) as Dictionary<any>;
}
