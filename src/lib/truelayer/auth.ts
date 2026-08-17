import "server-only";

export const isSandbox = () => {
  const clientId = process.env.TRUELAYER_CLIENT_ID || "";
  if (process.env.TRUELAYER_USE_SANDBOX === "true") return true;
  if (process.env.TRUELAYER_USE_SANDBOX === "false") return false;
  return clientId.startsWith("sandbox-");
};

export const getTrueLayerAuthBaseUrl = () =>
  isSandbox() ? "https://auth.truelayer-sandbox.com" : "https://auth.truelayer.com";

export const getTrueLayerApiBaseUrl = () =>
  isSandbox() ? "https://api.truelayer-sandbox.com/data/v1" : "https://api.truelayer.com/data/v1";

/**
 * Generate OAuth authorization URL for BoursoBank / Open Banking
 */
export function getTrueLayerAuthUrl(redirectUri: string, state?: string, providerId: string = "stet-boursorama"): string | null {
  const clientId = process.env.TRUELAYER_CLIENT_ID;
  if (!clientId) return null;

  const sandbox = isSandbox();
  const baseUrl = getTrueLayerAuthBaseUrl();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "info accounts balance transactions offline_access",
    redirect_uri: redirectUri,
    providers: providerId,
    provider_id: providerId,
    country_code: "FR",
    ...(sandbox ? { enable_mock: "true" } : {}),
    ...(state ? { state } : {}),
  });

  return `${baseUrl}/?${params.toString()}`;
}

/**
 * Refresh access token using refresh_token
 */
export async function refreshTrueLayerToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string } | null> {
  const clientId = process.env.TRUELAYER_CLIENT_ID;
  const clientSecret = process.env.TRUELAYER_CLIENT_SECRET;
  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const authBase = getTrueLayerAuthBaseUrl();
    const tokenRes = await fetch(`${authBase}/connect/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!tokenRes.ok) {
      console.warn("[TrueLayer] Token refresh failed:", tokenRes.status);
      return null;
    }

    const data = await tokenRes.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
    };
  } catch (e) {
    console.warn("[TrueLayer] Error refreshing token:", e);
    return null;
  }
}
