/** Size limit for QR code file size */
export const IMAGE_MAX_FILE_SIZE = 1 * 1024 * 1024;
/** Time limit for the server to respond for requests */
export const SERVER_TIMEOUT = 10_000;

/** worker bindings */
export type Env = { AUTH_TOKEN: string };
