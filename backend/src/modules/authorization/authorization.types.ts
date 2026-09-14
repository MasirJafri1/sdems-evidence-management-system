import { PermissionEffect } from "@prisma/client";

export interface AuthorizationResult {
  allowed: boolean;
  reason: string;

  source?:
    | "SUPER_ADMIN"
    | "ORG_ADMIN"
    | "CASE_ADMIN"
    | "CASE_PERMISSION"
    | "ROLE_PERMISSION"
    | "NONE";

  effect?: PermissionEffect;
}

