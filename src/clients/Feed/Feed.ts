import { Channel } from "phoenix";
import { StoreApi } from "zustand";
import EventEmitter from "eventemitter3";
import ApiClient from "../../api";
import createStore from "./store";
import {
  FeedMessagesReceivedPayload,
  FeedRealTimeEvent,
  FeedItemOrItems,
  FeedStoreState,
} from "./types";
import { FeedItem, FeedClientOptions } from "./interfaces";
import Knock from "../../knock";

export type Status =
  | "seen"
  | "read"
  | "archived"
  | "unseen"
  | "unread"
  | "unarchived";

class Feed {
  private apiClient: ApiClient;
  private userFeedId: string;
  private channelConnected: boolean = false;
  private channel: Channel;
  private broadcaster: EventEmitter;
  private defaultOptions: FeedClientOptions;

  // The raw store instance, used for binding in React and other environments
  public store: StoreApi<FeedStoreState>;

  constructor(
    readonly knock: Knock,
    readonly feedId: string,
    options: FeedClientOptions,
  ) {
    this.apiClient = knock.client();
    this.feedId = feedId;
    this.userFeedId = this.buildUserFeedId();
    this.store = createStore();
    this.broadcaster = new EventEmitter();
    this.defaultOptions = options;

    // Try and connect to the socket
    this.apiClient.connectSocket();

    this.channel = this.apiClient.createChannel(
      `feeds:${this.userFeedId}`,
      this.defaultOptions,
    );
  }

  /*
    Returns a socket to listen for feed updates
  */
  listenForUpdates() {
    if (!this.channelConnected) {
      this.channel.join().receive("ok", () => {
        this.channelConnected = true;
      });

      this.channel.on("new-message", (resp) => this.onNewMessageReceived(resp));
    }

    return () => {
      try {
        this.channel.leave();
      } catch (e) {
        // tslint:disable-next-line
        console.error("error while leaving channel", e);
      }
    };
  }

  /* Binds a handler to be invoked when event occurs */
  on(eventName: FeedRealTimeEvent, callback: () => void) {
    this.broadcaster.on(eventName, callback);
  }

  off(eventName: FeedRealTimeEvent, callback: () => void) {
    this.broadcaster.off(eventName, callback);
  }

  getState() {
    return this.store.getState();
  }

  async markAsSeen(itemOrItems: FeedItemOrItems) {
    const now = new Date().toISOString();
    this.optimisticallyPerformStatusUpdate(
      itemOrItems,
      "seen",
      { seen_at: now },
      "unseen_count",
    );
    return this.makeStatusUpdate(itemOrItems, "seen");
  }

  async markAsUnseen(itemOrItems: FeedItemOrItems) {
    this.optimisticallyPerformStatusUpdate(
      itemOrItems,
      "unseen",
      { seen_at: null },
      "unseen_count",
    );
    return this.makeStatusUpdate(itemOrItems, "unseen");
  }

  async markAsRead(itemOrItems: FeedItemOrItems) {
    const now = new Date().toISOString();
    this.optimisticallyPerformStatusUpdate(
      itemOrItems,
      "read",
      { read_at: now },
      "unread_count",
    );
    return this.makeStatusUpdate(itemOrItems, "read");
  }

  async markAsUnread(itemOrItems: FeedItemOrItems) {
    this.optimisticallyPerformStatusUpdate(
      itemOrItems,
      "unread",
      { read_at: null },
      "unread_count",
    );
    return this.makeStatusUpdate(itemOrItems, "unread");
  }

  async markAsArchived(itemOrItems: FeedItemOrItems) {
    const now = new Date().toISOString();
    this.optimisticallyPerformStatusUpdate(itemOrItems, "archived", {
      archived_at: now,
    });
    return this.makeStatusUpdate(itemOrItems, "archived");
  }

  async markAsUnarchived(itemOrItems: FeedItemOrItems) {
    this.optimisticallyPerformStatusUpdate(itemOrItems, "unarchived", {
      archived_at: null,
    });
    return this.makeStatusUpdate(itemOrItems, "unarchived");
  }

  /* Fetches the feed content, appending it to the store */
  async fetch(options: FeedClientOptions = {}) {
    const { setState } = this.store;

    setState((store) => store.setLoading(true));

    // Always include the default params, if they have been set
    const queryParams = { ...this.defaultOptions, ...options };

    const result = await this.apiClient.makeRequest({
      method: "GET",
      url: `/v1/users/${this.knock.userId}/feeds/${this.feedId}`,
      params: queryParams,
    });

    if (result.statusCode === "error") {
      setState((store) => store.setLoading(false));

      return {
        status: result.statusCode,
        data: result.error || result.body,
      };
    }

    const response = {
      entries: result.body.entries,
      meta: result.body.meta,
      page_info: result.body.page_info,
    };

    if (options.before) {
      const opts = { shouldSetPage: false, shouldAppend: true };
      setState((state) => state.setResult(response, opts));
    } else if (options.after) {
      const opts = { shouldSetPage: true, shouldAppend: true };
      setState((state) => state.setResult(response, opts));
    } else {
      setState((state) => state.setResult(response));
    }

    this.broadcast("messages.new", response);
    return { data: response, status: result.statusCode };
  }

  async fetchNextPage() {
    // Attempts to fetch the next page of results (if we have any)
    const { getState } = this.store;
    const { pageInfo } = getState();

    if (!pageInfo.after) {
      // Nothing more to fetch
      return;
    }

    this.fetch({ after: pageInfo.after });
  }

  private broadcast(eventName: FeedRealTimeEvent, data: any) {
    this.broadcaster.emit(eventName, data);
  }

  // Invoked when a new real-time message comes in from the socket
  private async onNewMessageReceived({
    metadata,
  }: FeedMessagesReceivedPayload) {
    // Handle the new message coming in
    const { getState, setState } = this.store;
    const currentHead: FeedItem | undefined = getState().items[0];
    // Optimistically set the badge counts
    setState((state) => state.setMetadata(metadata));
    // Fetch the items before the current head (if it exists)
    this.fetch({ before: currentHead?.__cursor });
  }

  private buildUserFeedId() {
    return `${this.feedId}:${this.knock.userId}`;
  }

  private optimisticallyPerformStatusUpdate(
    itemOrItems: FeedItemOrItems,
    type: Status,
    attrs: object,
    badgeCountAttr?: "unread_count" | "unseen_count",
  ) {
    const { getState, setState } = this.store;
    const itemIds = Array.isArray(itemOrItems)
      ? itemOrItems.map((item) => item.id)
      : [itemOrItems.id];

    if (badgeCountAttr) {
      const { metadata } = getState();

      const direction = type.startsWith("un")
        ? itemIds.length
        : -itemIds.length;

      setState((store) =>
        store.setMetadata({
          ...metadata,
          [badgeCountAttr]: Math.max(0, metadata[badgeCountAttr] + direction),
        }),
      );
    }

    // Update the items with the given attributes
    setState((store) => store.setItemAttrs(itemIds, attrs));
  }

  private async makeStatusUpdate(itemOrItems: FeedItemOrItems, type: Status) {
    // If we're interacting with an array, then we want to send this as a batch
    if (Array.isArray(itemOrItems)) {
      const itemIds = itemOrItems.map((item) => item.id);

      return await this.apiClient.makeRequest({
        method: "POST",
        url: `/v1/messages/batch/${type}`,
        data: { message_ids: itemIds },
      });
    }

    // If its a single then we can just call the regular endpoint
    const result = await this.apiClient.makeRequest({
      method: type.startsWith("un") ? "DELETE" : "PUT",
      url: `/v1/messages/${itemOrItems.id}/${type}`,
    });

    return result;
  }
}

export default Feed;
