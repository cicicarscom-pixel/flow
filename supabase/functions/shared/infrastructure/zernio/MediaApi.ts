import { ZernioApiContext, ZernioResponse } from "./types.ts";
import { withRetry } from "./ZernioError.ts";

export class MediaApi {
  constructor(private context: ZernioApiContext) {}

  async uploadMediaDirect(mimeType: string, bytes: Uint8Array): Promise<ZernioResponse> {
    return withRetry(() => {
      const blob = new Blob([bytes], { type: mimeType });
      return this.context.sdk.messages.uploadMediaDirect({
        body: {
          file: blob as any,
          contentType: mimeType
        }
      });
    });
  }
}
