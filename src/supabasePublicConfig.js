/**
 * Public Supabase connection details used by the packaged Cogulator app.
 *
 * This URL identifies the public retrieval endpoint used by the packaged app.
 * The endpoint is intentionally unauthenticated and rate-limited; never put a
 * Supabase secret key or any other secret in this file.
 */
// Leave these blank until the replacement public key is ready. A missing
// configuration disables Assist rather than preventing the desktop app from
// starting. The replacement key may still be bundled: it is a public client
// identifier, not a secret.
export const supabaseUrl = 'https://wiyosamydryxrssqfttf.supabase.co';
