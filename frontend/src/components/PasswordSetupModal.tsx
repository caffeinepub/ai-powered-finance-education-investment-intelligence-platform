import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { useSetUserPassword } from '../hooks/useQueries';
import { cn } from '@/lib/utils';

interface PasswordSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasExistingPassword?: boolean;
}

async function sha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function PasswordSetupModal({
  isOpen,
  onClose,
  hasExistingPassword = false,
}: PasswordSetupModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);

  const { mutateAsync: setUserPassword, isPending } = useSetUserPassword();

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirm(false);
    setValidationError('');
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!password) {
      setValidationError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    try {
      const hash = await sha256Hex(password);
      const result = await setUserPassword(hash);
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 1800);
      } else {
        setValidationError('Failed to save password. Please try again.');
      }
    } catch (err) {
      setValidationError('An error occurred. Please try again.');
    }
  };

  const passwordStrength = (() => {
    if (!password) return null;
    if (password.length < 6) return { label: 'Too short', color: 'text-red-400', width: 'w-1/4' };
    if (password.length < 8) return { label: 'Weak', color: 'text-amber-400', width: 'w-2/4' };
    if (password.length < 12) return { label: 'Good', color: 'text-teal', width: 'w-3/4' };
    return { label: 'Strong', color: 'text-emerald-400', width: 'w-full' };
  })();

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="glass-card border-primary/20 bg-background/95 backdrop-blur-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-foreground">
            <Lock className="h-5 w-5 text-teal" />
            {hasExistingPassword ? 'Update Password' : 'Set Password'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {hasExistingPassword
              ? 'Enter a new password to replace your existing one.'
              : 'Add a password as an extra layer of security for your account.'}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <p className="font-display font-semibold text-foreground text-lg">
              Password {hasExistingPassword ? 'Updated' : 'Set'} Successfully!
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Your account is now protected with a password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm text-foreground">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setValidationError('');
                  }}
                  placeholder="Minimum 6 characters"
                  className="bg-secondary/30 border-primary/20 text-foreground placeholder:text-muted-foreground pr-10 focus:border-teal/50"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength indicator */}
              {passwordStrength && (
                <div className="space-y-1">
                  <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        passwordStrength.width,
                        password.length < 6
                          ? 'bg-red-400'
                          : password.length < 8
                          ? 'bg-amber-400'
                          : password.length < 12
                          ? 'bg-teal'
                          : 'bg-emerald-400'
                      )}
                    />
                  </div>
                  <p className={cn('text-xs', passwordStrength.color)}>{passwordStrength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm text-foreground">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    setValidationError('');
                  }}
                  placeholder="Re-enter your password"
                  className={cn(
                    'bg-secondary/30 border-primary/20 text-foreground placeholder:text-muted-foreground pr-10 focus:border-teal/50',
                    confirmPassword && password !== confirmPassword && 'border-red-400/50'
                  )}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400">Passwords do not match</p>
              )}
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="rounded-lg bg-red-400/10 border border-red-400/20 px-3 py-2">
                <p className="text-xs text-red-400">{validationError}</p>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isPending}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !password || !confirmPassword}
                className="bg-teal text-background hover:bg-teal/90 font-semibold"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : hasExistingPassword ? (
                  'Update Password'
                ) : (
                  'Set Password'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
