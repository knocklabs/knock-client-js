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
    return new Feed(this.instance, feedChannelId, options);
  }
}

export default FeedClient;
