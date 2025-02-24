export type Token = string | undefined;

export type AuthState = {
  token: Token;
  isNewUser: boolean;
}