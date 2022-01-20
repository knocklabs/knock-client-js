export interface KnockOptions {
  host?: string;
}

export type GenericData = {
  // eslint-disable-next-line
  [x: string]: any;
};

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
