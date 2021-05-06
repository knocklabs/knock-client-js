import ApiClient from "./api";
import FeedClient from "./clients/feed";
import { KnockOptions } from "./interfaces";

const DEFAULT_HOST = "https://api.knock.app";

class Knock {
  private host: string;
  private userToken: string | undefined;
  private apiClient: ApiClient | null = null;
  public userId: string | undefined;

  readonly feeds = new FeedClient(this);

  constructor(readonly apiKey: string, options: KnockOptions = {}) {
    this.host = options.host || DEFAULT_HOST;

    // Fail loudly if we're using the wrong API key
    if (this.apiKey.startsWith("sk_")) {
      throw new Error(
        "[Knock] You are using your secret API key on the client. Please use the public key.",
      );
    }
  }

  client() {
    if (!this.userId && !this.userToken) {
      throw new Error(
        "[Knock] You must call `authenticate(userId, userToken)` first before trying to make a request",
      );
    }

    // Initiate a new API client if we don't have one yet
    if (!this.apiClient) {
      this.apiClient = new ApiClient({
        apiKey: this.apiKey,
        host: this.host,
        userToken: this.userToken,
      });
    }

    return this.apiClient;
  }

  /*
    Authenticates the current user. In non-sandbox environments
    the userToken must be specified.
  */
  authenticate(userId: string, userToken?: string) {
    this.userId = userId;
    this.userToken = userToken;

    return;
  }

  // Used to teardown any connected instances
  teardown() {
    if (this.apiClient) {
      this.apiClient.disconnectSocket();
    }
  }
}

export default Knock;
