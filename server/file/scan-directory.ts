import { ChromaKnowledgeStore } from '../knowledge/chroma';
import { ProjectRoot } from './file';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';

const execAsync = promisify(exec);

const excludePattern = ['.env', '.git', 'node_modules', 'yarn.lock', 'package-lock.json'];

export async function listFilesNotIgnoredByGit(dir: string): Promise<string[]> {
  try {
    // Get the list of files not ignored by .gitignore
    const { stdout } = await execAsync('git ls-files --others --exclude-standard && git ls-files', {
      cwd: dir,
    });
    const files = stdout
      .split('\n')
      .filter((file) => file)
      .filter((file) => {
        return !excludePattern.some((pattern) => file.includes(pattern));
      });
    return files;
  } catch (error) {
    console.error('Error executing git command:', error);
    return [];
  }
}

function sanitizeDirName(dir: string) {
  return dir.replace(/[^a-zA-Z0-9]/g, '');
}

export class DirectoryManager {
  public knowledgeStore: ChromaKnowledgeStore;

  constructor(public projectRoot: ProjectRoot) {
    this.knowledgeStore = new ChromaKnowledgeStore(sanitizeDirName(projectRoot.dir));
  }

  async scanDirectory() {
    await this.knowledgeStore.init();

    // List all files that are not ignored by .gitignore
    const files = await listFilesNotIgnoredByGit(this.projectRoot.dir);
    // Add each file to the knowledge store
    for (const file of files) {
      try {
        const text = await fs.readFile(`${this.projectRoot.dir}/${file}`, { encoding: 'utf-8' });
        if (text.length > 10000) {
          // Skip this, probably a lockfile or binary
          console.log('Skipping large file:', file);
          continue;
        }
        await this.knowledgeStore.addDocument({ source: `file:${file}`, text });
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }

    if (files.length > 10000) {
      throw new Error('There seem to be too many files in the project, check the exclude pattern.');
    }

    // Add the list of files as a document to the knowledge store
    await this.knowledgeStore.addDocument({
      source: 'file-list',
      text: files.join('\n'),
    });
  }
}
