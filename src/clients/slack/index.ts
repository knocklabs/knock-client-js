import { ApiResponse } from "../../api";
import Knock from "../../knock";

type SlackChannelConnection = {
  access_token: string;
  channel_id: string;
};

type ChannelConnectionInput = {
  objectId: string;
  collection: string;
  knockChannelId: string;
  slackChannelId: string;
  connections: SlackChannelConnection[];
  userId: string;
};

type GetSlackChannelsInput = {
  tenantId: string;
  objectId?: string;
  collection?: string;
  knockChannelId: string;
};

class SlackClient {
  private instance: Knock;

  constructor(instance: Knock) {
    this.instance = instance;
  }

  async getChannels(params: GetSlackChannelsInput) {
    const result = await this.instance.client().makeRequest({
      method: "GET",
      url: `/v1/slack/channels`,
      params: {
        object_id: params.objectId,
        collection: params.collection,
        tenant_id: params.tenantId,
        knock_channel_id: params.knockChannelId,
      },
    });

    return this.handleResponse(result);
  }

  async setChannelConnections({
    objectId,
    collection,
    knockChannelId,
    connections,
    userId,
  }: ChannelConnectionInput) {
    const result = await this.instance.client().makeRequest({
      method: "PUT",
      url: `v1/objects/${collection}/${objectId}/channel_data/${knockChannelId}`,
      data: { data: { connections }, user_id: userId },
    });

    return this.handleResponse(result);
  }

  private handleResponse(response: ApiResponse) {
    if (response.statusCode === "error") {
      throw new Error(response.error || response.body);
    }

    return response.body;
  }
}

export default SlackClient;
