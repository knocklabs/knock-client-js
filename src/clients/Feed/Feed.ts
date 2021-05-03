import { Channel } from "phoenix";
import { StoreApi } from "zustand";
import EventEmitter from "eventemitter3";
import ApiClient from "../ApiClient";
import { FeedClientOptions } from "../FeedClient";
import createStore from "./feedStore";
import { NewMessageReceivedData, FeedItem, StoreState } from "./types";

interface FeedFetchOptions extends FeedClientOptions {}

type RealTimeEvents = "messages.new";

type ItemOrItems = FeedItem | FeedItem[];

type StatusType =
  | "seen"
  | "read"
  | "archived"
  | "unseen"
  | "unread"
  | "unarchived";

class Feed {
  private apiClient: ApiClient;
  private feedId: string;
  private userId: string;
  private userFeedId: string;
  private channelConnected: boolean;
  private channel: Channel;
  private broadcaster: EventEmitter;
  private defaultOptions: FeedClientOptions;

  // The raw store instance, used for binding in React and other environments
  public store: StoreApi<StoreState>;

  constructor(client: any, feedId: string, options: FeedClientOptions) {
    this.apiClient = client;
    this.feedId = feedId;
    this.userId = client.userId;
    this.userFeedId = this.buildUserFeedId();
    this.store = createStore();
    this.broadcaster = new EventEmitter();
    this.defaultOptions = options;

    // Try and connect to the socket
    this.apiClient.connectSocket();
    this.channel = this.apiClient.createChannel(`feeds:${this.userFeedId}`);
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
        console.error("error while leaving channel", e);
      }
    };
  }

  /* Binds a handler to be invoked when event occurs */
  on(eventName: RealTimeEvents, callback: () => void) {
    this.broadcaster.on(eventName, callback);
  }

  off(eventName: RealTimeEvents, callback: () => void) {
    this.broadcaster.off(eventName, callback);
  }

  getState() {
    return this.store.getState();
  }

  async markAsSeen(itemOrItems: ItemOrItems) {
    const now = new Date().toISOString();
    this.optimisticallyPerformStatusUpdate(
      itemOrItems,
      "seen",
      { seen_at: now },
      "unseen_count"
    );
    return this.makeStatusUpdate(itemOrItems, "seen");
  }

  async markAsUnseen(itemOrItems: ItemOrItems) {
    this.optimisticallyPerformStatusUpdate(
      itemOrItems,
      "unseen",
      { seen_at: null },
      "unseen_count"
    );
    return this.makeStatusUpdate(itemOrItems, "unseen");
  }

  async markAsRead(itemOrItems: ItemOrItems) {
    const now = new Date().toISOString();
    this.optimisticallyPerformStatusUpdate(
      itemOrItems,
      "read",
      { read_at: now },
      "unread_count"
    );
    return this.makeStatusUpdate(itemOrItems, "read");
  }

  async markAsUnread(itemOrItems: ItemOrItems) {
    this.optimisticallyPerformStatusUpdate(
      itemOrItems,
      "unread",
      { read_at: null },
      "unread_count"
    );
    return this.makeStatusUpdate(itemOrItems, "unread");
  }

  async markAsArchived(itemOrItems: ItemOrItems) {
    const now = new Date().toISOString();
    this.optimisticallyPerformStatusUpdate(itemOrItems, "archived", {
      archived_at: now,
    });
    return this.makeStatusUpdate(itemOrItems, "archived");
  }

  async markAsUnarchived(itemOrItems: ItemOrItems) {
    this.optimisticallyPerformStatusUpdate(itemOrItems, "unarchived", {
      archived_at: null,
    });
    return this.makeStatusUpdate(itemOrItems, "unarchived");
  }

  /* Fetches the feed content, appending it to the store */
  async fetch(options: FeedFetchOptions = {}) {
    const { setState } = this.store;

    setState((store) => store.setLoading(true));

    // Always include the default params, if they have been set
    const queryParams = { ...this.defaultOptions, ...options };

    const result = await this.apiClient.makeRequest({
      method: "GET",
      url: `/v1/users/${this.userId}/feeds/${this.feedId}`,
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
      // We were doing a before fetch, so prepend these
      setState((state) => state.prependItems(response));
    } else if (options.after) {
      // Append items as fetching after
      setState((state) => state.appendItems(response));
    } else {
      // Otherwise just clobber everything in here
      setState((state) => state.setResult(response));
    }

    this.broadcast("messages.new", response);

    return { data: response, status: result.statusCode };
  }

  private broadcast(eventName: RealTimeEvents, data: any) {
    this.broadcaster.emit(eventName, data);
  }

  // Invoked when a new real-time message comes in from the socket
  private async onNewMessageReceived({ metadata }: NewMessageReceivedData) {
    // Handle the new message coming in
    const { getState, setState } = this.store;
    const currentHead: FeedItem | undefined = getState().items[0];
    // Optimistically set the badge counts
    setState((state) => state.setMetadata(metadata));
    // Fetch the items before the current head (if it exists)
    this.fetch({ before: currentHead?.__cursor });
  }

  private buildUserFeedId() {
    return `${this.feedId}:${this.userId}`;
  }

  private optimisticallyPerformStatusUpdate(
    itemOrItems: ItemOrItems,
    type: StatusType,
    attrs: object,
    badgeCountAttr?: "unread_count" | "unseen_count"
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
        })
      );
    }

    // Update the items with the given attributes
    setState((store) => store.setItemAttrs(itemIds, attrs));
  }

  private async makeStatusUpdate(itemOrItems: ItemOrItems, type: StatusType) {
    // If we're interacting with an array, then we want to send this as a batch
    if (Array.isArray(itemOrItems)) {
      const itemIds = itemOrItems.map((item) => item.id);

      const result = await this.apiClient.makeRequest({
        method: "POST",
        url: `/v1/messages/batch/${type}`,
        data: { message_ids: itemIds },
      });

      return result;
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
