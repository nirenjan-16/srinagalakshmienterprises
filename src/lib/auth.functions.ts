import { createServerFn } from "@tanstack/react-start";

import {
  generateRecoveryCodeSchema,
  resetPasswordSchema,
  signInSchema,
  updateCredentialsSchema,
} from "./auth.schemas";

export const signInAccount = createServerFn({ method: "POST" })
  .inputValidator(signInSchema)
  .handler(async ({ data }) => {
    const { verifyCredentials } = await import("./auth.server");
    return verifyCredentials(data.username, data.password);
  });

export const updateAccountCredentials = createServerFn({ method: "POST" })
  .inputValidator(updateCredentialsSchema)
  .handler(async ({ data }) => {
    const { changeCredentials } = await import("./auth.server");
    return changeCredentials(data);
  });

export const generateRecoveryCode = createServerFn({ method: "POST" })
  .inputValidator(generateRecoveryCodeSchema)
  .handler(async ({ data }) => {
    const { issueRecoveryCode } = await import("./auth.server");
    return issueRecoveryCode(data.username, data.currentPassword);
  });

export const resetPasswordAccount = createServerFn({ method: "POST" })
  .inputValidator(resetPasswordSchema)
  .handler(async ({ data }) => {
    const { resetPasswordWithCode } = await import("./auth.server");
    return resetPasswordWithCode(data.username, data.recoveryCode, data.newPassword);
  });
