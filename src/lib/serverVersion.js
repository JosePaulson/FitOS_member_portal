// The API sends its boot version in an `X-Server-Version` response header on
// every response (it changes whenever the server is redeployed/restarted).
// The axios layer reports it here, and UpdateChecker watches for a change — so
// "the server was updated" is detected from ordinary traffic, with no polling.
// If the server doesn't send the header (older deploy), UpdateChecker falls
// back to a slow GET /api/version poll.

export const SERVER_VERSION_EVENT = 'fitos:server-version'

export function noteServerVersion(headers) {
  const version = headers?.['x-server-version']
  if (version && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SERVER_VERSION_EVENT, { detail: String(version) }))
  }
}
