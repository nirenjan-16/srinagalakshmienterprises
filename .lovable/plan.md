# Reset the default admin password

## User-facing result

- Reset the existing `admin` account password to `admin123` in the connected database.
- Keep the existing username-based sign-in and local session behavior unchanged.
- Leave the current Settings password-change and recovery-code features in place; they already exist, so no duplicate UI will be added.

## Secure handling

- Generate a bcrypt hash for the new password and store only the hash in the `users.password_hash` column.
- Never put the plaintext password in application source, browser storage, logs, or the returned result.
- Verify the admin row and confirm that the password hash was updated without reading or exposing hash contents.

## Verification

- Check the database update result for the `admin` username.
- Verify the login route accepts the new password through the existing server-side bcrypt sign-in function.
- Confirm the reset-password route and Settings recovery controls remain available and the build has no new errors.