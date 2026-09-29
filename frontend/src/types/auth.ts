import type { MemberProfileDemo } from './domain.ts';

export type AuthStatus =
  | 'INITIALIZING'
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATED_MEMBER'
  | 'AUTHENTICATED_TECHNICAL_ADMIN';

export type ActorType = 'MEMBER' | 'TECHNICAL_ADMIN';

export interface AuthenticatedUser {
  userId: string;
  actorType: ActorType;
  role: string;
  memberId: string | null;
  membershipStatus: string | null;
  member: MemberProfileDemo | null;
}

export interface LoginResponse {
  authenticated: boolean;
  user: {
    id: string;
    email: string;
    actorType: ActorType;
    memberId: string | null;
  };
}

export interface CurrentUserResponse {
  authenticated: boolean;
  userId: string;
  actorType: ActorType;
  role: string;
  memberId: string | null;
  membershipStatus: string | null;
  member: MemberProfileDemo | null;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
