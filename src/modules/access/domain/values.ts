import { InvalidEmailError } from "./errors";

declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type UserId = Brand<string, "UserId">;
export type IdentityId = Brand<string, "IdentityId">;
export type Email = Brand<string, "Email">;

export type PermissionKey = `${string}:${string}`;
export type RoleKey = string;

export const userId = (v: string): UserId => v as UserId;
export const identityId = (v: string): IdentityId => v as IdentityId;

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const email = (raw: string): Email => {
  const normalized = raw.trim().toLowerCase();
  if (!EMAIL_SHAPE.test(normalized)) throw new InvalidEmailError(raw);
  return normalized as Email;
};
