import { PageInfo } from "../../interfaces";
import { NetworkStatus } from "../../networkStatus";
import { FeedItem, FeedMetadata, FeedResponse } from "./interfaces";

export type StoreFeedResultOptions = {
  shouldSetPage?: boolean;
  shouldAppend?: boolean;
};

export type FeedStoreState = {
  items: FeedItem[];
  pageInfo: PageInfo;
  metadata: FeedMetadata;
  loading: boolean;
  networkStatus: NetworkStatus;
  setResult: (response: FeedResponse, opts?: StoreFeedResultOptions) => void;
  setMetadata: (metadata: FeedMetadata) => void;
  setLoading: (loading: boolean) => void;
  setNetworkStatus: (networkStatus: NetworkStatus) => void;
  setItemAttrs: (itemIds: string[], attrs: object) => void;
};

export type FeedMessagesReceivedPayload = {
  metadata: FeedMetadata;
};

/*
Event types:

- `messages.new`: legacy event fired for all messages (feed items) received, real-time or not
- `items.new`: all real-time items received via a socket update
- `items.fetched`: invoked every time a page is fetched (like on initial load)
*/
export type FeedRealTimeEvent = "messages.new";
export type FeedEvent = FeedRealTimeEvent | "items.new" | "items.fetched";

export type FeedEventPayload = {
  event: Omit<FeedEvent, "messages.new">;
  items: FeedItem[];
  metadata: FeedMetadata;
};

export type FeedRealTimeCallback = (resp: FeedResponse) => void;

export type FeedEventCallback = (payload: FeedEventPayload) => void;

export type FeedItemOrItems = FeedItem | FeedItem[];
