import "server-only";
import { Snaptrade, SnaptradeAuth, PersonalApiKeyAuth } from "snaptrade-typescript-sdk";

export function getSnapTradeClient(): Snaptrade<PersonalApiKeyAuth> | null {
  const clientId = process.env.SNAPTRADE_CLIENT_ID;
  const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY;

  if (!clientId || !consumerKey) {
    return null;
  }

  return new Snaptrade({
    auth: SnaptradeAuth.personalApiKey({
      clientId,
      consumerKey,
    }),
  });
}
