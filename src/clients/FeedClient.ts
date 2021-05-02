import Knock from "../Knock";
import Feed from "./Feed";

export interface FeedClientOptions {
  before?: string;
  after?: string;
  page_size?: number;
  status?: "unread" | "unseen" | "all";
}

class FeedClient {
  private instance: Knock;

  constructor(instance: Knock) {
    this.instance = instance;
  }

  initialize(feedChannelId: string, options: FeedClientOptions = {}) {
    const apiClient = this.instance.client();
    return new Feed(apiClient, feedChannelId, options);
  }
}

export default FeedClient;
