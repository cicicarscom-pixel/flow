export class ZernioError extends Error {
  public code: string;
  public status: number;
  public details?: any;

  constructor(message: string, status: number = 500, code: string = 'ZERNIO_API_ERROR', details?: any) {
    super(message);
    this.name = 'ZernioError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Standardized wrapper for Zernio API calls with Retry mechanism for Rate Limits (429).
 */
export async function withRetry<T>(operation: () => Promise<T>, retries: number = 2, delayMs: number = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const isRateLimit = error.status === 429 || error.message?.includes('429') || error.message?.includes('rate limit');
    if (isRateLimit && retries > 0) {
      console.warn(`[Zernio Rate Limit] Retrying in ${delayMs}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return withRetry(operation, retries - 1, delayMs * 2);
    }
    
    // Wrap unknown errors into ZernioError
    if (error instanceof ZernioError) throw error;
    
    console.error('[Zernio Error]', error.message || error);
    throw new ZernioError(error.message || 'Unknown Zernio Error', error.status || 500, 'ZERNIO_EXECUTION_FAILED', error);
  }
}
