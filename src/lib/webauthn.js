import { startRegistration, startAuthentication, browserSupportsWebAuthn, platformAuthenticatorIsAvailable } from '@simplewebauthn/browser'
import { authApi } from '../api/index'

/** Whether this browser/device can plausibly offer fingerprint/face login at all. */
export async function fingerprintLoginAvailable() {
  if (!browserSupportsWebAuthn()) return false
  try { return await platformAuthenticatorIsAvailable() } catch { return false }
}

/**
 * Registers this device's fingerprint/face for the signed-in member.
 * Called from Profile settings. Throws on cancellation/failure — callers
 * should catch and show a friendly message.
 */
export async function registerFingerprint(deviceName) {
  const { data: options } = await authApi.webauthnRegisterOptions()
  const response = await startRegistration({ optionsJSON: options })
  await authApi.webauthnRegisterVerify(response, deviceName)
}

/**
 * Runs the fingerprint login ceremony for a remembered gym + phone and
 * returns the same {accessToken, refreshToken, member, gym} shape PIN
 * login does. Throws if there's nothing registered, or the ceremony is
 * cancelled/fails.
 */
export async function loginWithFingerprint(subdomain, phone) {
  const { data: options } = await authApi.webauthnLoginOptions({ subdomain, phone })
  const response = await startAuthentication({ optionsJSON: options })
  const { data } = await authApi.webauthnLoginVerify({ subdomain, phone, response })
  return data
}
