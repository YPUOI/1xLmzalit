/**
 * Biometric and Password Security Service for UCL Prediction App
 */

import { SecurityConfig } from '../types';
import { DEFAULT_SECURITY_CONFIG } from '../data/defaultData';

const STORAGE_KEY_CONFIG = 'ucl_security_config';
const STORAGE_KEY_AUTH_STATUS = 'ucl_friend_authenticated';
const STORAGE_KEY_AUTH_TIMESTAMP = 'ucl_friend_auth_time';

export function getSecurityConfig(): SecurityConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return DEFAULT_SECURITY_CONFIG;
    const parsed = JSON.parse(raw);
    if (parsed.friendPassword === 'CHAMPIONS2026') {
      parsed.friendPassword = '1xlmzalit-official';
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({ ...DEFAULT_SECURITY_CONFIG, ...parsed }));
    }
    return { ...DEFAULT_SECURITY_CONFIG, ...parsed };
  } catch {
    return DEFAULT_SECURITY_CONFIG;
  }
}

export function saveSecurityConfig(config: SecurityConfig): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

export function applySyncedFriendPassword(friendPassword: string): void {
  if (!friendPassword) return;
  const current = getSecurityConfig();
  if (current.friendPassword !== friendPassword) {
    const updated = { ...current, friendPassword };
    saveSecurityConfig(updated);
  }
}

export function isFriendAuthenticated(): boolean {
  // Always require password on page load / refresh per strict security requirement
  try {
    sessionStorage.removeItem(STORAGE_KEY_AUTH_STATUS);
    localStorage.removeItem(STORAGE_KEY_AUTH_STATUS);
    localStorage.removeItem(STORAGE_KEY_AUTH_TIMESTAMP);
  } catch {
    // Ignore storage access errors
  }
  return false;
}

export function setFriendAuthenticated(authenticated: boolean, _remember: boolean = false): void {
  // Never persist across page refreshes; clean up any persistent tokens
  try {
    sessionStorage.removeItem(STORAGE_KEY_AUTH_STATUS);
    localStorage.removeItem(STORAGE_KEY_AUTH_STATUS);
    localStorage.removeItem(STORAGE_KEY_AUTH_TIMESTAMP);
  } catch {
    // Ignore storage access errors
  }
}

export function verifyFriendPassword(inputPassword: string): boolean {
  const config = getSecurityConfig();
  return inputPassword.trim().toLowerCase() === config.friendPassword.trim().toLowerCase();
}

/**
 * Check if the browser supports WebAuthn / Biometric authentication
 */
export async function isBiometricAvailable(): Promise<{ supported: boolean; platformAuthenticator: boolean }> {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return { supported: false, platformAuthenticator: false };
    }
    const hasPlatform = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.();
    return {
      supported: true,
      platformAuthenticator: !!hasPlatform
    };
  } catch {
    return { supported: false, platformAuthenticator: false };
  }
}

/**
 * Enroll Biometrics (Face ID, Touch ID, Windows Hello, Fingerprint) using WebAuthn
 */
export async function enrollBiometrics(label: string = 'صديق معتمد'): Promise<{ success: boolean; error?: string }> {
  try {
    if (!window.PublicKeyCredential) {
      throw new Error('متصفحك لا يدعم نظام المصادقة البيومترية المباشر.');
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: '1XLMZALIT Champions League Security',
          id: window.location.hostname
        },
        user: {
          id: userId,
          name: 'friend@ucl.app',
          displayName: label
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Built-in TouchID, FaceID, Windows Hello
          userVerification: 'preferred',
          requireResidentKey: false
        },
        timeout: 60000,
        attestation: 'none'
      }
    }) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('لم يتم تأكيد المصادقة البيومترية.');
    }

    const currentConfig = getSecurityConfig();
    saveSecurityConfig({
      ...currentConfig,
      biometricEnrolled: true,
      biometricCredentialId: credential.id,
      biometricUserLabel: label
    });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'فشل تسجيل المصادقة البيومترية';
    return { success: false, error: message };
  }
}

/**
 * Verify Biometrics (Touch ID / Face ID / Fingerprint / Device Biometrics)
 */
export async function authenticateWithBiometrics(): Promise<{ success: boolean; error?: string }> {
  const config = getSecurityConfig();
  if (!config.biometricEnrolled) {
    return { success: false, error: 'لم يتم تفعيل البصمة البيومترية بعد على هذا الجهاز.' };
  }

  try {
    if (!window.PublicKeyCredential) {
      throw new Error('المصادقة البيومترية غير مدعومة.');
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
        allowCredentials: config.biometricCredentialId ? [
          {
            id: Uint8Array.from(atob(config.biometricCredentialId.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
            type: 'public-key',
            transports: ['internal']
          }
        ] : []
      }
    });

    if (assertion) {
      return { success: true };
    }
    return { success: false, error: 'تعذر التحقق من البصمة البيومترية.' };
  } catch (err: unknown) {
    // If WebAuthn fails due to iframe sandbox or platform constraints, allow simulated biometric confirmation fallback
    const message = err instanceof Error ? err.message : 'فشل التحقق البيومتري';
    return { success: false, error: message };
  }
}
