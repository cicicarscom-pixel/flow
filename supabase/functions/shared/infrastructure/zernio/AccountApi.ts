import { ConnectUrlPayload, ZernioApiContext, ZernioResponse, AnalyticsPayload } from "./types.ts";
import { withRetry, ZernioError } from "./ZernioError.ts";

export class AccountApi {
  constructor(private context: ZernioApiContext) {}

  async getConnectUrl(payload: ConnectUrlPayload): Promise<ZernioResponse> {
    return withRetry(() => this.context.sdk.connect.getConnectUrl({
      path: { platform: payload.platform },
      query: {
        profileId: payload.profileId,
        ...(payload.redirectUrl ? { redirect_url: payload.redirectUrl } : {})
      }
    }));
  }

  async listAccounts(profileId: string): Promise<ZernioResponse> {
    return withRetry(() => this.context.sdk.accounts.listAccounts({ query: { profileId } }));
  }

  async disconnectAccount(accountId: string): Promise<void> {
    return withRetry(async () => {
      let success = false;
      const sdk = this.context.sdk;
      try {
        if (typeof (sdk.accounts as any).deleteAccount === 'function') {
           await (sdk.accounts as any).deleteAccount({ id: accountId });
           success = true;
        } else if (typeof (sdk.accounts as any).removeAccount === 'function') {
           await (sdk.accounts as any).removeAccount({ id: accountId });
           success = true;
        } else if (typeof (sdk.connect as any).disconnect === 'function') {
           await (sdk.connect as any).disconnect({ id: accountId });
           success = true;
        }
      } catch (err: any) {
        console.error("Zernio account deletion warning (SDK):", err.message);
      }

      if (!success) {
        // Fallback to direct REST fetch
        const fetchRes = await fetch(`https://api.zernio.com/v1/accounts/${accountId}`, {
           method: 'DELETE',
           headers: {
              'Authorization': `Bearer ${this.context.apiKey}`,
              'Content-Type': 'application/json'
           }
        });
        if (!fetchRes.ok) {
           throw new ZernioError(await fetchRes.text(), fetchRes.status, 'DISCONNECT_FAILED');
        }
      }
    });
  }

  async getFollowerStats(payload: AnalyticsPayload): Promise<ZernioResponse> {
    return withRetry(() => this.context.sdk.accounts.getFollowerStats(payload));
  }
}
