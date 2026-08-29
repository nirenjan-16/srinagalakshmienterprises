# Secure no-email password recovery

## User-facing result

- Add a **Forgot password?** action to the username login screen.
- Add a public **Reset password** route that accepts the username, a one-time recovery code, a new password, and confirmation.
- Add a signed-in **Generate recovery code** action in Settings. It requires the current password, displays the code once, and clearly tells the user to store it safely.
- Keep username-based sign-in and the existing local session behavior. No email provider or email address is required.
- Show generic failure messages so the login and reset screens do not reveal whether a username exists or whether a recovery code was valid.

## Secure behavior

- Verify usernames, current passwords, recovery codes, and new-password rules with shared Zod validation on both client and server.
- Move sign-in, credential updates, recovery-code generation, and password reset into server functions. The browser will no longer select or receive `password_hash` values.
- Generate recovery codes with cryptographically secure randomness; store only a bcrypt/hash-derived value in the database.
- Make each recovery code single-use and short-lived, invalidate it immediately after a successful reset, and invalidate older codes when a new one is generated.
- Use timing-safe comparisons where a secret is compared directly, rate-limit failed recovery attempts, and avoid logging passwords or recovery codes.
- Preserve the current-password requirement for ordinary signed-in password changes.

## Database migration

- Extend `public.users` with the minimum recovery fields: a hashed recovery-code value, expiry timestamp, used timestamp, and failed-attempt/lockout tracking as needed by the server flow.
- Add indexes only where they support the reset lookup/expiry cleanup; do not add a plaintext recovery-code column.
- Replace the current broad public access pattern for `users` with policies/grants that prevent anonymous reads of password and recovery hashes while still allowing the server-side auth functions to operate safely.
- Include explicit grants in the same migration and keep existing user IDs, usernames, and password hashes intact.

## Application updates

- Add a thin client-safe auth functions module and a server-only implementation path that queries the database and hashes/verifies secrets.
- Update login to call the server sign-in function and retain the existing localStorage session only after server verification.
- Update Settings to call the authenticated credential-update flow and add recovery-code generation with a one-time reveal state.
- Add the reset route before linking to it, with accessible form labels, password confirmation, loading/error/success states, and navigation back to login after success.
- Keep route metadata specific for `/login`, `/settings`, and `/reset-password`.
- Do not expose service-role credentials or recovery secrets in client code.

## Verification

- Apply the migration through the database migration workflow.
- Verify the normal login and signed-in password change paths.
- Verify recovery-code generation, successful single-use reset, rejection of reuse/expiry/wrong code, password confirmation validation, and generic error messages.
- Check the production build and the live preview for blank-screen, route-generation, console, and network errors.

## Important limitation

With no email or second delivery channel, a forgotten password can only be recovered if the user previously generated and securely stored the recovery code, or an authorized system operator performs an out-of-band recovery. The app will not display or regenerate an old code after it is lost.
