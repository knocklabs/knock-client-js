import { Activity, GenericData, User, PageInfo } from "../../interfaces";

// Specific feed interfaces

export interface FeedClientOptions {
  before?: string;
  after?: string;
  page_size?: number;
  status?: "unread" | "unseen" | "all";
  // Optionally scope all notifications to a particular source only
  source?: string;
  // Optionally scope all requests to a particular tenant
  tenant?: string;
  include_archived?: boolean;
}

export interface ContentBlock {
  content: string;
  rendered: string;
  type: "markdown" | "text";
  name: string;
}

export interface NotificationSource {
  key: string;
  version_id: string;
}

export interface FeedItem {
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
  data: GenericData;
  source: NotificationSource;
}

export interface FeedMetadata {
  total_count: number;
  unread_count: number;
  unseen_count: number;
}

export interface FeedResponse {
  entries: FeedItem[];
  meta: FeedMetadata;
  page_info: PageInfo;
}
