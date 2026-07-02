export class ZernioClient {
  private baseUrl = 'https://api.zernio.com/v1'; // Placeholder
  private apiKey = Deno.env.get('ZERNIO_API_KEY') || '';

  async sendMessage(accountId: string, conversationId: string, text: string): Promise<void> {
    const url = `${this.baseUrl}/inbox/conversations/${conversationId}/messages`;
    
    const payload = {
      accountId,
      message: text
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Zernio reply failed:", errorText);
      throw new Error(`Zernio API error: ${errorText}`);
    }
  }

  async replyToComment(accountId: string, postId: string, commentId: string, text: string): Promise<void> {
    const url = `${this.baseUrl}/inbox/comments/${postId}`;
    
    const payload = {
      accountId,
      commentId,
      message: text
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Zernio comment reply failed:", errorText);
      throw new Error(`Zernio API error: ${errorText}`);
    }
  }

  async likeComment(accountId: string, postId: string, commentId: string): Promise<void> {
    const url = `${this.baseUrl}/inbox/comments/${postId}/${commentId}/like`;
    
    const payload = { accountId };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Zernio like comment failed:", errorText);
    }
  }
}
