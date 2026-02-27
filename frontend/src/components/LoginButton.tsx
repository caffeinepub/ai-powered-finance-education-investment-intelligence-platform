import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

interface LoginButtonProps {
  displayName?: string;
  compact?: boolean;
}

export default function LoginButton({ displayName, compact = false }: LoginButtonProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  if (isAuthenticated && !compact) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8 border border-primary/40 shadow-[0_0_8px_oklch(0.65_0.26_300/0.3)]">
          <AvatarImage
            src="/assets/generated/avatar-placeholder-new.dim_128x128.png"
            alt="User avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/generated/default-avatar.dim_128x128.png';
            }}
          />
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
            {displayName ? displayName.slice(0, 2).toUpperCase() : 'U'}
          </AvatarFallback>
        </Avatar>
        {displayName && (
          <span className="text-sm font-medium text-foreground hidden md:block">{displayName}</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAuth}
          disabled={isLoggingIn}
          className="text-muted-foreground hover:text-foreground rounded-full"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleAuth}
      disabled={isLoggingIn}
      size="sm"
      className="btn-violet gap-2 rounded-full px-4"
    >
      {isLoggingIn ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogIn className="h-4 w-4" />
      )}
      {isLoggingIn ? 'Connecting...' : 'Login'}
    </Button>
  );
}
