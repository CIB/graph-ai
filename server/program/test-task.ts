import 'dotenv/config';
import { ProjectRoot } from '@/server/file/file';
import { Task } from '../task/task';
import { Recipe, evalRecipeLLM } from '../recipe/recipe';

export async function main() {
  const projectRoot: ProjectRoot = { dir: '/home/cib/projects/graph-ai' };
  const task = new Task(projectRoot);

  task.subgoals.push('Find the source code relevant to the task');
  task.subgoals.push(
    'Build relations using symbols, function calls etc. to find other relevant code',
  );
  task.subgoals.push('Find other relevant information such as documentation, issues etc.');
  task.subgoals.push(
    'Find a way to represent chunks / pieces of source code as structured parts of whole files, instead of only representing whole files',
  );
  task.subgoals.push(
    'Optional: For indexing pieces of source code for semantic search, it could make sense to store them along with the functions, classes, etc. they use or are used by, rather than the file they are part of',
  );
  task.subgoals.push(
    'Create a recipe concept where some computation (problem -> solution) can be described in words, and then we can either use an LLM to generate the solution, or have the LLM write a piece of code to create the solution instead',
  );

  const recipe: Recipe = {
    name: 'Get source language',
    inputs: ['filename', 'content'],
    outputs: ['language'],
    description: 'Get the programming language identifier (LangID) of the given source code.',
  };

  const args = {
    filename: 'test-task.js',
    content: 'console.log("Hello, World!");',
  };

  const language = (await evalRecipeLLM(recipe, args)).language;
}

void main();
