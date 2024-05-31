import { ProjectRoot } from '../file/file';
import { DirectoryManager } from '../file/scan-directory';

export class Task {
  private directoryManager?: DirectoryManager;
  public subgoals: string[] = [];

  constructor(public projectRoot: ProjectRoot) {
    this.directoryManager = new DirectoryManager(projectRoot);
    this.directoryManager.scanDirectory();
  }
}
