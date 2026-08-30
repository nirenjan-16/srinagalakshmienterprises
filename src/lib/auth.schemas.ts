import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(1, "Username is required.")
  .max(100, "Username is too long.");

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters.")
  .max(128, "Password is too long.");

export const recoveryCodeSchema = z
  .string()
  .trim()
  .min(8, "Recovery code is invalid.")
  .max(128, "Recovery code is invalid.");

export const signInSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "Password is required.").max(128, "Password is too long."),
});

export const updateCredentialsSchema = z.object({
  currentUsername: usernameSchema,
  currentPassword: z.string().min(1).max(128),
  nextUsername: usernameSchema,
  newPassword: passwordSchema.optional(),
});

export const generateRecoveryCodeSchema = z.object({
  username: usernameSchema,
  currentPassword: z.string().min(1).max(128),
});

export const resetPasswordSchema = z.object({
  username: usernameSchema,
  recoveryCode: recoveryCodeSchema,
  newPassword: passwordSchema,
});
