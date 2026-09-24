export type UserRole = "DINKES" | "PUSKESMAS";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  puskesmasCode?: string | null;
}
