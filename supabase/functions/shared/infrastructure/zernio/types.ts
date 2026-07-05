export interface ZernioResponse<T = any> {
  data?: T;
  [key: string]: any;
}

export interface ConnectUrlPayload {
  platform: string;
  profileId: string;
  redirectUrl?: string;
}

export interface CreatePostPayload {
  title?: string;
  content: string;
  platforms: string[] | { platform: string; accountId: string }[];
  scheduledFor?: string;
  publishNow?: boolean;
  mediaItems?: any[];
  tags?: string[];
}

export interface AnalyticsPayload {
  profileId?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  period?: string;
}

export interface ZernioApiContext {
  apiKey: string;
  sdk: any; // Instantiated Zernio SDK
}
