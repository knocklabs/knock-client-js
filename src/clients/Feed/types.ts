import { PageInfo } from "../../interfaces";
import { NetworkStatus } from "../../networkStatus";
import { FeedItem, FeedMetadata, FeedResponse, TriggeredBy } from "./interfaces";

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

export type FeedRealTimeCallbackPayload = {
  triggeredBy?: TriggeredBy;
} & FeedResponse;

export type FeedRealTimeEvent = "messages.new";

export type FeedRealTimeCallback = (resp: FeedRealTimeCallbackPayload) => void;

export type FeedItemOrItems = FeedItem | FeedItem[];
