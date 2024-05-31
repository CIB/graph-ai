import { Dictionary } from "lodash";

/**
 * Represents a query builder that allows constructing LLM queries in a fluent manner.
 */
export class QueryBuilder {
  blocks: Dictionary<string[]> = {};
  currentBlock = "";
  blockOrder: string[] = [];

  /**
   * Selects a block for adding queries.
   * If the block does not exist, it creates a new block.
   * @param blockName - The name of the block.
   * @returns The QueryBuilder instance.
   */
  selectBlock(blockName: string): QueryBuilder {
    if (!(blockName in this.blocks)) {
      this.blocks[blockName] = [];
      this.blockOrder.push(blockName);
    }
    this.currentBlock = blockName;
    return this;
  }

  /**
   * Adds a query to the currently selected block.
   * @param text - The query to be added.
   * @returns The QueryBuilder instance.
   */
  push(text: string): QueryBuilder {
    this.blocks[this.currentBlock].push(text);
    return this;
  }

  /**
   * Alias for the `push` method.
   * Adds a query to the currently selected block.
   * @param text - The query to be added.
   * @returns The QueryBuilder instance.
   */
  p(text: string): QueryBuilder {
    return this.push(text);
  }

  /**
   * Adds a new line to the currently selected block.
   * @returns The QueryBuilder instance.
   */
  n(): QueryBuilder {
    return this.push("");
  }

  /**
   * Converts the query blocks into a string representation.
   * @returns The string representation of the query blocks.
   */
  toString(): string {
    return this.blockOrder
      .map((blockName) => this.blocks[blockName].join("\n"))
      .join("\n\n");
  }
}
