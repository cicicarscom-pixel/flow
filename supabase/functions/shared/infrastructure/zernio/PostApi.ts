import { CreatePostPayload, ZernioApiContext, ZernioResponse } from "./types.ts";
import { withRetry } from "./ZernioError.ts";

export class PostApi {
  constructor(private context: ZernioApiContext) {}

  async listPosts(profileId: string): Promise<ZernioResponse> {
    return withRetry(() => this.context.sdk.posts.listPosts({ query: { profileId } }));
  }

  async createPost(payload: CreatePostPayload): Promise<ZernioResponse> {
    return withRetry(() => this.context.sdk.posts.createPost({ body: payload }));
  }
}
