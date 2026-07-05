import { ZernioApiContext, ZernioResponse } from "./types.ts";
import { withRetry } from "./ZernioError.ts";

export class ProfileApi {
  constructor(private context: ZernioApiContext) {}

  async listProfiles(): Promise<ZernioResponse> {
    return withRetry(() => this.context.sdk.profiles.listProfiles());
  }

  async createProfile(name: string): Promise<ZernioResponse> {
    return withRetry(() => this.context.sdk.profiles.createProfile({ body: { name } }));
  }
}
