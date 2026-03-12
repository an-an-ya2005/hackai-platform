export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface OAuthProfile {
  providerId: string;
  provider: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}
