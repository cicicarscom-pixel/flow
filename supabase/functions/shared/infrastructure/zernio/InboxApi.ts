import { ZernioApiContext, ZernioResponse } from "./types.ts";
import { withRetry, ZernioError } from "./ZernioError.ts";

export class InboxApi {
  constructor(private context: ZernioApiContext) {}

  async listInboxConversations(profileId: string): Promise<ZernioResponse> {
    return withRetry(() => this.context.sdk.messages.listInboxConversations({ query: { profileId } }));
  }

  async getInboxConversationMessages(conversationId: string, accountId: string): Promise<ZernioResponse> {
    return withRetry(() => this.context.sdk.messages.getInboxConversationMessages({ 
        path: { conversationId },
        query: { accountId }
    }));
  }

  async sendMessage(accountId: string, conversationId: string, text: string): Promise<ZernioResponse> {
    return withRetry(async () => {
      const fetchRes = await fetch(`https://api.zernio.com/v1/inbox/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.context.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId,
          message: text
        })
      });
      
      if (!fetchRes.ok) {
        throw new ZernioError(await fetchRes.text(), fetchRes.status, 'SEND_MESSAGE_FAILED');
      }
      return await fetchRes.json();
    });
  }
}
