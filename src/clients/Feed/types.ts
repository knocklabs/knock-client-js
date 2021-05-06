import { FeedItem, FeedMetadata, FeedResponse } from "./interfaces";

export type FeedStoreState = {
  items: FeedItem[];
  metadata: FeedMetadata;
  loading: boolean;
  setResult: (response: FeedResponse) => void;
  prependItems: (response: FeedResponse) => void;
  appendItems: (response: FeedResponse) => void;
  setMetadata: (metadata: FeedMetadata) => void;
  setLoading: (loading: boolean) => void;
  setItemAttrs: (itemIds: string[], attrs: object) => void;
};

export type FeedMessagesReceivedPayload = {
  metadata: FeedMetadata;
};

export type FeedRealTimeEvent = "messages.new";

export type FeedItemOrItems = FeedItem | FeedItem[];
