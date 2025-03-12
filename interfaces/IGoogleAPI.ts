export interface IGoogleAPI {
  accounts: any;
}

export interface IInitTokenClientCallback {
  access_token: string,
  expires_in: number,
  /*
  * Hosted domain
  * */
  hd: any,
  token_type: any,
  scope: string | string[],
  error: any,
  error_description: string,
  error_uri: string
}

export interface IInitTokenClientResult {
  requestAccessToken: () => void;
}