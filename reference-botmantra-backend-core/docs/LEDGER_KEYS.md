Ledger Key Design — Overview

Objectives
- Ensure forward secrecy and support remote device revocation (remote wipe).
- Keep keys minimal and derivable; allow epoched rotation.

Key types
- `root_kek` (device): device-level key-encryption-key derived from user passphrase + device salt (PBKDF2/Argon2id).
- `signing_key` (ed25519): device private key for commit signatures; does not encrypt blobs.
- `blob_key` (AES-256-GCM): ephemeral per-blob symmetric key used to encrypt content.
- `wrapped_blob_key` : `blob_key` encrypted with `root_kek` (stored in `blob:cid` metadata).
- `backup_key` : rotating key for central-server 7-day backups (device-side encrypted with root_kek).

Key lifecycle
- Key derivation: `root_kek = KDF(user_secret, device_salt, iter)`; store `device_salt` in LevelDB `hdr:device:<deviceId>`.
- Blob creation: generate `blob_key`, encrypt blob with AES-256-GCM, store ciphertext in file system, store wrapped_blob_key in `blob:cid` metadata.
- Key rotation: issue new `root_kek` epoch; re-wrap blob keys lazily on access or via background re-wrap worker.
- Revocation / remote wipe: adding device id to `revoked_devices` list and rotating `backup_key`; to fully wipe, server signals devices to delete local KEKs and optionally instruct clients to purge LevelDB (if supportable).

Recovery
- Allow export of `wrapped_root_kek` (root_kek encrypted with user recovery key) for account recovery.

Notes
- Use hardware-backed keystore where available; otherwise protect `root_kek` with passphrase and OS-protected storage.
