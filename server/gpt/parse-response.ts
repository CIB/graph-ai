/**
 * Parses a JSON response string, removing comments and trimming lines.
 * @param response - The JSON response string to parse.
 * @returns The parsed JSON object.
 */
export function parseJSONResponse(response: string): any {
  // Try to find the first opening { and parse the JSON from there
  const firstOpenBracket = response.indexOf('{');
  response = response.slice(firstOpenBracket);

  // Try to also trim anything after the JSON object
  const lastCloseBracket = response.lastIndexOf('}');
  response = response.slice(0, lastCloseBracket + 1);

  const parsedResponse = JSON.parse(response.trim());

  return parsedResponse;
}
