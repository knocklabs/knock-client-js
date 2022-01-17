import { Activity, GenericData, User, PageInfo } from "../../interfaces";
import { NetworkStatus } from "../../networkStatus";

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

export type FetchFeedOptions = {
  __loadingType?: NetworkStatus.loading | NetworkStatus.fetchMore;
  __fetchSource?: "socket" | "http";
} & FeedClientOptions;

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

export interface FeedItem<T = GenericData> {
  __cursor: string;
  id: string;
  activities: Activity[];
  actors: User[];
  blocks: ContentBlock[];
  inserted_at: string;
  updated_at: string;
  read_at: string | null;
  seen_at: string | null;
  archived_at: string | null;
  total_activities: number;
  total_actors: number;
  data: T;
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
