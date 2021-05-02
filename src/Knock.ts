import ApiClient from "./clients/ApiClient";
import FeedClient from "./clients/FeedClient";

type clientOptions = {
  host?: string;
};

class Knock {
  private apiKey: string;
  private host: string;
  private userToken: string;
  private apiClient: ApiClient | null;
  public feeds: FeedClient;
  protected userId: string;

  constructor(publicApiKey: string, options: clientOptions = {}) {
    this.apiKey = publicApiKey;
    this.host = options.host || "https://api.knock.app";

    this.feeds = new FeedClient(this);

    // Fail loudly if we're using the wrong API key
    if (this.apiKey.startsWith("sk_")) {
      throw new Error(
        "[Knock] You are using your secret API key on the client. Please use the public key."
      );
    }
  }

  client() {
    if (!this.userToken) {
      throw new Error(
        "[Knock] You must call `authenticate` first before trying to make a request"
      );
    }

    // Initiate a new API client if we don't have one yet
    if (!this.apiClient) {
      this.apiClient = new ApiClient({
        apiKey: this.apiKey,
        host: this.host,
        userId: this.userId,
        userToken: this.userToken,
      });
    }

    return this.apiClient;
  }

  authenticate(userId: string, userToken: string) {
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
