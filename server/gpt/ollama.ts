import ollama from 'ollama';
import colors from 'colors';

export async function getOllamaCompletion(prompt: string, verbose = true) {
  if (verbose) console.log(colors.cyan('Requesting'), colors.green(prompt));
  const response = await ollama.generate({
    model: 'llama3:8b',
    prompt,
  });
  if (verbose) console.log(colors.yellow('Response:'), colors.green(response.response));
  return response.response;
}
