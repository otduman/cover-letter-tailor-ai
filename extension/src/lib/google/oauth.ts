// Google OAuth for Firefox via identity.launchWebAuthFlow.
//
// Firefox cannot use Chrome's getAuthToken, so we run the standard
// authorization-code flow ourselves:
//   1. open Google's consent screen in launchWebAuthFlow
//   2. capture the ?code= from the redirect back to our extension URL
//   3. exchange the code for access + refresh tokens
//   4. store the refresh token; mint short-lived access tokens on demand
//
// We use a "Web application" OAuth client (the only type that accepts the
// https extension redirect URL), so the client secret is required at the
// token endpoint. For a single-user personal tool this is an acceptable
// trade-off — a multi-user product would move this exchange to a backend.
import { getSettings, setSettings } from "../storage";

const SCOPE = "https://www.googleapis.com/auth/documents";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

/** The redirect URL Google must be told to allow. Stable per add-on install. */
export function getRedirectURL(): string {
  return browser.identity.getRedirectURL();
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

/** Interactive consent flow. Stores the refresh token on success. */
export async function connectGoogle(): Promise<void> {
  const { googleClientId, googleClientSecret } = await getSettings();
  if (!googleClientId || !googleClientSecret) {
    throw new Error("Enter your Google Client ID and Client Secret first.");
  }

  const redirectUri = getRedirectURL();
  const authUrl =
    `${AUTH_ENDPOINT}?client_id=${encodeURIComponent(googleClientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(SCOPE)}` +
    `&access_type=offline&prompt=consent`;

  const redirectResponse = await browser.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true,
  });

  const returned = new URL(redirectResponse);
  const error = returned.searchParams.get("error");
  if (error) throw new Error(`Google denied access: ${error}`);

  const code = returned.searchParams.get("code");
  if (!code) throw new Error("No authorization code returned by Google.");

  const tokens = await postToken({
    code,
    client_id: googleClientId,
    client_secret: googleClientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  if (!tokens.refresh_token) {
    throw new Error(
      "Google did not return a refresh token. Revoke the app at " +
        "myaccount.google.com/permissions and connect again."
    );
  }

  await setSettings({ googleRefreshToken: tokens.refresh_token });
}

/** Mint a fresh access token from the stored refresh token. */
export async function getAccessToken(): Promise<string> {
  const { googleClientId, googleClientSecret, googleRefreshToken } =
    await getSettings();
  if (!googleRefreshToken) throw new Error("Not connected to Google.");

  const tokens = await postToken({
    client_id: googleClientId,
    client_secret: googleClientSecret,
    refresh_token: googleRefreshToken,
    grant_type: "refresh_token",
  });
  return tokens.access_token;
}

export async function disconnectGoogle(): Promise<void> {
  await setSettings({ googleRefreshToken: "" });
}

async function postToken(params: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok || data.error) {
    throw new Error(
      `Google token request failed: ${data.error_description ?? data.error ?? res.status}`
    );
  }
  return data;
}
