import {
  IGoogleAPI,
  IInitTokenClientCallback,
  IInitTokenClientResult
} from "../interfaces/IGoogleAPI";
import {useEffect, useState} from "react";

type GsiAuthResult = {
  client: IInitTokenClientResult | null,
  accessToken: string | null
}

export function useGoogleAuth(gsi: IGoogleAPI | null | undefined, clientId: string, scopes: string[] | string): GsiAuthResult {
  const [client, setClient] = useState<IInitTokenClientResult | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (gsi === null || gsi === undefined)
      return;

    const result = gsi.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: scopes,
      callback: (tokenResponse: IInitTokenClientCallback) => {
        setAccessToken(tokenResponse.access_token);
      }
    });

    setClient(result);
  }, [gsi, clientId, scopes])

  return {
    client,
    accessToken
  }
}