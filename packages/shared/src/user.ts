export enum UserRole {
  PLAYER = 'PLAYER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

/** То, что безопасно отдавать наружу: без пароля и служебных полей */
export interface PublicUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  createdAt: string;
}
