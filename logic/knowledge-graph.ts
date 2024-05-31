import { type TextWithCitations } from './citation';

export type EntityID = string;

export interface Entity {
  uuid: EntityID;
  name: string;
  description?: TextWithCitations;
}

export type RelationDefinitionId = string;

export interface RelationDefinitionParameter {
  name?: string;
  type: EntityID;
}

export interface RelationDefinition {
  uuid: RelationDefinitionId;
  name: string;
  description?: TextWithCitations;
  parameters: RelationDefinitionParameter[];
}

export interface Relation {
  predicate: RelationDefinitionId;
  tuple: EntityID[];
}

export interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
  relationDefinitions: RelationDefinition[];
}
