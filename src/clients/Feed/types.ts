export type User = {
  id: string;
  email: string;
  name: string;
  updated_at: string;
  created_at: string | null;
} & Object;

export type Activity = {
  id: string;
  inserted_at: string;
  recipient: User;
  actor: User;
  data: object;
};

export type ContentBlock = {
  content: string;
  rendered: string;
  type: "markdown" | "text";
  name: string;
};

export type FeedItem = {
  __cursor: string;
  id: string;
  activities: Activity[];
  actors: User[];
  blocks: ContentBlock[];
  inserted_at: string;
  updated_at: string;
  read_at: string | null;
  seen_at: string | null;
  total_activities: number;
  total_actors: number;
};

export type PageInfo = {
  after: string | null;
  before: string | null;
  limit: number;
};

export type FeedMetadata = {
  total_count: number;
  unread_count: number;
  unseen_count: number;
};

export type FeedResponse = {
  entries: FeedItem[];
  meta: FeedMetadata;
  page_info: PageInfo;
};

export type NewMessageReceivedData = {
  metadata: FeedMetadata;
};
