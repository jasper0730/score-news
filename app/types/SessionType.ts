export type SessionType = {
  id: string;
  email?: string;
  password?: string;
  emailVerified?: boolean | null;
  image?: string;
}