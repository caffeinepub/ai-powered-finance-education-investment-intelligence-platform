import React, { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, XCircle, AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { cn } from '@/lib/utils';

const CREDENTIAL_STORAGE_KEY_PREFIX = 'finiq_webauthn_credential_';

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const arrayBuffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

type BiometricStatus =
  | 'idle'
  | 'registering'
  | 'registered'
  | 'authenticating'
  | 'auth_success'
  | 'auth_failed'
  | 'error';

export default function BiometricAuthButton() {
  const { identity } = useInternetIdentity();
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [hasCredential, setHasCredential] = useState(false);
  const [status, setStatus] = useState<BiometricStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const principalStr = identity?.getPrincipal().toString() ?? 'anonymous';
  const storageKey = `${CREDENTIAL_STORAGE_KEY_PREFIX}${principalStr}`;

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      !!window.PublicKeyCredential &&
      typeof navigator.credentials?.create === 'function';
    setIsSupported(supported);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    setHasCredential(!!stored);
  }, [storageKey]);

  const handleRegister = async () => {
    setStatus('registering');
    setStatusMessage('');

    try {
      const challenge = window.crypto.getRandomValues(new Uint8Array(32));
      const userIdBytes = new TextEncoder().encode(principalStr).slice(0, 64);
      // Ensure userId is backed by a plain ArrayBuffer for WebAuthn compatibility
      const userId = new Uint8Array(new ArrayBuffer(userIdBytes.length));
      userId.set(userIdBytes);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'FinIQ',
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: principalStr,
            displayName: 'FinIQ User',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },   // ES256
            { alg: -257, type: 'public-key' },  // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred',
          },
          timeout: 60000,
          attestation: 'none',
        },
      }) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('No credential returned');
      }

      const credentialId = base64urlEncode(credential.rawId);
      localStorage.setItem(storageKey, credentialId);
      setHasCredential(true);
      setStatus('registered');
      setStatusMessage('Fingerprint registered successfully! You can now use it to authenticate.');
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name === 'NotAllowedError') {
        setStatusMessage('Registration was cancelled or denied. Please try again.');
      } else if (error?.name === 'InvalidStateError') {
        setStatusMessage('A credential already exists for this device. Try authenticating instead.');
      } else {
        setStatusMessage('Registration failed. Your device may not support biometric authentication.');
      }
      setStatus('error');
    }
  };

  const handleAuthenticate = async () => {
    setStatus('authenticating');
    setStatusMessage('');

    const storedCredentialId = localStorage.getItem(storageKey);
    if (!storedCredentialId) {
      setStatus('error');
      setStatusMessage('No registered fingerprint found. Please register first.');
      return;
    }

    try {
      const challenge = window.crypto.getRandomValues(new Uint8Array(32));
      // base64urlDecode now returns Uint8Array<ArrayBuffer> — compatible with BufferSource
      const credentialIdBytes = base64urlDecode(storedCredentialId);

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          allowCredentials: [
            {
              id: credentialIdBytes,
              type: 'public-key',
              transports: ['internal'],
            },
          ],
          userVerification: 'required',
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (!assertion) {
        throw new Error('No assertion returned');
      }

      setStatus('auth_success');
      setStatusMessage('Biometric authentication successful! Identity verified.');
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name === 'NotAllowedError') {
        setStatus('auth_failed');
        setStatusMessage('Authentication was cancelled or the biometric did not match.');
      } else {
        setStatus('auth_failed');
        setStatusMessage('Authentication failed. Please try again.');
      }
    }
  };

  const handleReset = () => {
    localStorage.removeItem(storageKey);
    setHasCredential(false);
    setStatus('idle');
    setStatusMessage('');
  };

  if (isSupported === null) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking biometric support…
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-400/10 border border-amber-400/20">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-400">Biometrics Not Supported</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your browser or device does not support WebAuthn biometric authentication.
          </p>
        </div>
      </div>
    );
  }

  const isLoading = status === 'registering' || status === 'authenticating';

  return (
    <div className="space-y-3">
      {/* Status Message */}
      {statusMessage && (
        <div
          className={cn(
            'flex items-start gap-2.5 p-3 rounded-lg border text-sm',
            status === 'registered' || status === 'auth_success'
              ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
              : status === 'auth_failed' || status === 'error'
              ? 'bg-red-400/10 border-red-400/20 text-red-400'
              : 'bg-teal/10 border-teal/20 text-teal'
          )}
        >
          {status === 'registered' || status === 'auth_success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          ) : status === 'auth_failed' || status === 'error' ? (
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {!hasCredential ? (
          <Button
            onClick={handleRegister}
            disabled={isLoading}
            className="bg-teal/10 text-teal border border-teal/30 hover:bg-teal/20 font-medium"
            variant="ghost"
          >
            {status === 'registering' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Registering…
              </>
            ) : (
              <>
                <Fingerprint className="h-4 w-4 mr-2" />
                Register Fingerprint
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              onClick={handleAuthenticate}
              disabled={isLoading}
              className="bg-teal/10 text-teal border border-teal/30 hover:bg-teal/20 font-medium"
              variant="ghost"
            >
              {status === 'authenticating' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying…
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Authenticate with Fingerprint
                </>
              )}
            </Button>
            <Button
              onClick={handleReset}
              disabled={isLoading}
              variant="ghost"
              className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 text-xs"
              size="sm"
            >
              Remove Registration
            </Button>
          </>
        )}
      </div>

      {/* Registered indicator */}
      {hasCredential && status !== 'registering' && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-teal" />
          Fingerprint registered on this device
        </p>
      )}
    </div>
  );
}
