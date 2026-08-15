import { NextResponse } from "next/server";
import { getTrueLayerAuthBaseUrl } from "@/lib/truelayer/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/?truelayer_status=error&msg=${encodeURIComponent(error || "No code returned")}`);
  }

  const clientId = process.env.TRUELAYER_CLIENT_ID;
  const clientSecret = process.env.TRUELAYER_CLIENT_SECRET;
  const redirectUri = `${origin}/api/integrations/truelayer/callback`;

  if (!clientSecret) {
    // If client secret is not yet set in environment, redirect with code so client can use or store it
    return NextResponse.redirect(`${origin}/?truelayer_status=code_received&code=${encodeURIComponent(code)}`);
  }

  try {
    const authBase = getTrueLayerAuthBaseUrl();
    const tokenRes = await fetch(`${authBase}/connect/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId || "",
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      return NextResponse.redirect(`${origin}/?truelayer_status=token_error&msg=${encodeURIComponent(errBody)}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Success redirect with token in session or param
    return NextResponse.redirect(`${origin}/?truelayer_status=success&token=${encodeURIComponent(accessToken)}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(`${origin}/?truelayer_status=exchange_failed&msg=${encodeURIComponent(msg)}`);
  }
}
