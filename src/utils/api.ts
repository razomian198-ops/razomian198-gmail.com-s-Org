/**
 * Safe API Fetch Utility for FactInfoLive
 * 
 * Validates HTTP response status and content-type before parsing JSON.
 * Prevents "Unexpected token < in JSON at position 0" errors when the server
 * returns HTML error pages or SPA fallbacks.
 */

export interface SafeApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  status: number;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    const status = res.status;
    const contentType = res.headers.get('content-type') || '';

    // Check if the response is actually JSON before calling res.json()
    if (!contentType.toLowerCase().includes('application/json')) {
      const textPreview = (await res.text()).slice(0, 120).replace(/\s+/g, ' ');
      console.warn(
        `[API] Non-JSON response from ${url} (status ${status}, content-type: "${contentType}"): ${textPreview}`
      );
      return {
        ok: false,
        error: `Invalid server response format (${contentType || 'non-JSON'}, status ${status})`,
        status,
      };
    }

    const data = await res.json();

    if (!res.ok) {
      const errorMsg =
        (data && typeof data === 'object' && (data.error || data.message)) ||
        `Request failed with status ${status}`;
      return {
        ok: false,
        data,
        error: errorMsg,
        status,
      };
    }

    return {
      ok: true,
      data,
      status,
    };
  } catch (err: any) {
    console.warn(`[API] Network or parsing error fetching ${url}:`, err.message || err);
    return {
      ok: false,
      error: err.message || 'Network request failed',
      status: 0,
    };
  }
}
