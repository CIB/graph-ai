import { Dictionary, flatMap } from 'lodash';
import { listFilesNotIgnoredByGit } from './scan-directory';
import fs from 'fs/promises';
import { QueryBuilder } from '../query-builder/query-builder';
import { getChatCompletion } from '../gpt/gpt';
import { parseJSONResponse } from '../gpt/parse-response';

export interface File {
  type: 'file';
  name: string;
  fullPath: string;
  size: number;
  summary?: string;
}

export interface Directory {
  type: 'directory';
  name: string;
  fullPath: string;
  directories: Directory[];
  files: File[];
  size: number;
  content: number;
  summary?: string;
  assignedPoints?: number;
}

export type Item = File | Directory;

async function getDirectoryContents(dir: string): Promise<Directory> {
  let files = await listFilesNotIgnoredByGit(dir);

  // Build a tree structure from the complete list of files
  const tree: Directory = {
    type: 'directory',
    name: '/',
    fullPath: dir,
    directories: [],
    files: [],
    size: 0,
    content: 0,
  };
  for (const file of files) {
    const parts = file.split('/');
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current.files.push({ type: 'file', name: part, fullPath: `${dir}/${file}`, size: 0 });
      } else {
        let next = current.directories.find((d) => d.name === part);
        if (!next) {
          next = {
            type: 'directory',
            name: part,
            fullPath: `${dir}/${parts.slice(0, i + 1).join('/')}`,
            directories: [],
            files: [],
            size: 0,
            content: 0,
          };
          current.directories.push(next);
        }
        current = next;
      }
    }
  }

  // Recursively compute the number of files and total size of each directory
  async function computeSizeAndContent(directory: Directory) {
    for (const file of directory.files) {
      file.size = (await fs.stat(file.fullPath)).size;
    }
    directory.size = directory.files.reduce((acc, f) => acc + f.size, 0);
    directory.content = directory.files.length;
    for (const d of directory.directories) {
      await computeSizeAndContent(d);
      directory.size += d.size;
      directory.content += d.content;
    }
  }

  await computeSizeAndContent(tree);

  return tree;
}

// Resolve the directories as files if they don't contain many files
function resolveDirectory(directory: Directory): Item[] {
  if (directory.files.length + directory.directories.length < 4) {
    return directory.files
      .map((file) => file as Item)
      .concat(flatMap(directory.directories, (d) => resolveDirectory(d)));
  } else {
    return [directory];
  }
}

export async function summarizeDirectory(dir: string) {
  const tree = await getDirectoryContents(dir);
  return summarizeDirectoryRecursive(tree, 50);
}

export async function summarizeDirectoryRecursive(tree: Directory, points: number) {
  const summarizeItems: Item[] = tree.files;
  summarizeItems.push(...flatMap(tree.directories, (d) => resolveDirectory(d)));

  // Ask GPT which files or directories from the list are most important to summarize
  const relevantItems = (await getRelevantItems(summarizeItems, points)).slice(0, 5);

  for (const item of relevantItems) {
    if (item.type === 'file') {
      item.summary = await summarizeFile(item.fullPath);
    } else {
      if (item.assignedPoints && item.assignedPoints >= 1) {
        await summarizeDirectoryRecursive(item, item.assignedPoints);
      }
    }
  }

  tree.summary = await summarizeDirectoryQuery(tree);
  // Print all the pairs of file - summary for files and directories that have a summary
  function printRecursive(item: Item, indent: number) {
    if (item.summary) {
      console.log('  '.repeat(indent) + item.name + ' - ' + item.summary);
    }
    if (item.type === 'directory') {
      for (const child of (item.directories as Item[]).concat(item.files)) {
        printRecursive(child, indent + 1);
      }
    }
  }
  printRecursive(tree, 0);
}

export async function getRelevantItems(items: Item[], points: number): Promise<Item[]> {
  const query = new QueryBuilder();
  query
    .selectBlock('description')
    .p(
      `We are currently summarizing and trying to understand the project structure. Please sort the following files and directories by relevance to summarizing the project. Assign points to each directory (but not to files) - the total must sum up to ${points}`,
    )
    .p(
      JSON.stringify(
        items.map((item) => ({
          type: item.type,
          path: item.fullPath,
          size: item.size,
        })),
      ),
    )
    .p(
      'Please provide the sorted list of relevant files and directories in the following JSON format:',
    )
    .p(
      '{ "sorted": [{"path": "path/to/file/a.txt"}, {"path": "path/to/directory/b", "points": 50}] }',
    );

  const queryText = query.toString();
  const response = await getChatCompletion(queryText);
  const sorted: { path: string; points?: number }[] = parseJSONResponse(response).sorted;

  const sortedItems = sorted.map((result) => {
    const item = items.find((i) => i.fullPath === result.path);
    if (!item) {
      console.error(`Item not found: ${result}`);
      return null;
    }
    if (item.type === 'directory') {
      item.assignedPoints = result.points || 0;
    }
    return item;
  });

  return sortedItems.filter((item) => !!item) as Item[];
}

export async function summarizeFile(fullPath: string) {
  const query = new QueryBuilder();
  const content = (await fs.readFile(fullPath, 'utf-8')).slice(0, 3000);
  query
    .selectBlock('description')
    .p(
      'We are currently summarizing and trying to understand the project structure. Please summarize the following file:',
    )
    .p(`File: ${fullPath}`)
    .p(content)
    .p(
      'Please provide a description of what the file does in the context of the project in the following JSON format:',
    )
    .p('{ "summary": "foo bar" }');

  const queryText = query.toString();
  const response = await getChatCompletion(queryText);
  const summary = parseJSONResponse(response).summary;

  return summary;
}

export async function summarizeDirectoryQuery(tree: Directory) {
  const query = new QueryBuilder();
  query
    .selectBlock('description')
    .p(
      'We are currently summarizing and trying to understand the project structure. Please summarize the following directory:',
    )
    .p(`Directory: ${tree.fullPath}`)
    .p(tree.directories.map((d) => `${d.fullPath} - ${d.summary}`).join('\n'))
    .p(tree.files.map((f) => `${f.fullPath} - ${f.summary}`).join('\n'))
    .p(
      'Please provide a description of what the directory does in the context of the project in the following JSON format:',
    )
    .p('{ "summary": "foo bar" }');

  const queryText = query.toString();
  const response = await getChatCompletion(queryText);
  const summary = parseJSONResponse(response).summary;

  return summary;
}
