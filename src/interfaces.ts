export type JsonValue =
  | string
  | number
  | boolean
  | JsonObject
  | JsonArray
  | null
  | undefined;

export interface JsonObject {
  [x: string]: JsonValue;
}

export type JsonArray = Array<JsonValue>;

export interface KnockOptions {
  host?: string;
}

// Left here to not break any usage
export type GenericData = JsonObject;

export interface User extends GenericData {
  id: string;
  email: string;
  name: string;
  updated_at: string;
  created_at: string | null;
}

export interface PageInfo {
  after: string | null;
  before: string | null;
  page_size: number;
}

export interface Activity {
  id: string;
  inserted_at: string;
  updated_at: string;
  recipient: User;
  actor: User;
  data: GenericData;
}
