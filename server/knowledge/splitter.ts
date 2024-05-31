export interface TextChunk {
  text: string;
  start: number;
  end: number;
}

export function splitByLine(text: string, chunkSize = 6000): TextChunk[] {
  const chunks: TextChunk[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex;
    let lastValidEndIndex = startIndex;

    // Advance endIndex to the next newline or the end of the file
    while (endIndex < text.length && endIndex - startIndex < chunkSize) {
      if (text[endIndex] === '\n') {
        lastValidEndIndex = endIndex;
      }
      endIndex++;
    }

    // Check if the next newline or the end of the file is too far
    if (endIndex - startIndex >= chunkSize) {
      if (lastValidEndIndex > startIndex) {
        // If there is a valid breakpoint before chunkSize
        endIndex = lastValidEndIndex;
      } else {
        // If no newline has been found, split at chunkSize
        endIndex = startIndex + chunkSize;
      }
    }

    // Avoid exceeding the text length
    endIndex = Math.min(endIndex, text.length);

    // Add the current chunk to the array
    chunks.push({
      text: text.substring(startIndex, endIndex).trim(),
      start: startIndex,
      end: endIndex,
    });

    // Update startIndex to just after the last character of the current chunk
    startIndex = endIndex + 1;
  }

  return chunks.filter((chunk) => chunk.text.length);
}
