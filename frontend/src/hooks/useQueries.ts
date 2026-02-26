import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useActor } from './useActor';
import type {
  UserProfileInput,
  UserProfileView,
  LearningProgress,
  LearningProgressView,
  Prediction,
  Portfolio,
  Conversation,
  Post,
  NewsArticle,
  Alert
} from '../backend';
import { Variant_high_critical_medium } from '../backend';

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfileView | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfileInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Password Management ──────────────────────────────────────────────────────

export function useSetUserPassword() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (passwordHash: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setUserPassword(passwordHash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useVerifyUserPassword() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (passwordHash: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.verifyUserPassword(passwordHash);
    },
  });
}

// ─── Learning Progress ────────────────────────────────────────────────────────

export function useGetLearningProgress() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<LearningProgressView | null>({
    queryKey: ['learningProgress'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getLearningProgress();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSaveLearningProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progress: LearningProgress) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveLearningProgress(progress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learningProgress'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Predictions ──────────────────────────────────────────────────────────────

export function useGetUserPredictions() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Prediction[]>({
    queryKey: ['userPredictions'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserPredictions();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSubmitPrediction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prediction: Prediction) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitPrediction(prediction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPredictions'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── News Articles ────────────────────────────────────────────────────────────

export function useGetNewsArticles() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<NewsArticle[]>({
    queryKey: ['newsArticles'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getNewsArticles();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetNewsArticle(id: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<NewsArticle | null>({
    queryKey: ['newsArticle', id.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getNewsArticle(id);
    },
    enabled: !!actor && !actorFetching,
  });
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export function useGetPortfolio() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Portfolio | null>({
    queryKey: ['portfolio'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPortfolio();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSavePortfolio() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (portfolio: Portfolio) => {
      if (!actor) throw new Error('Actor not available');
      return actor.savePortfolio(portfolio);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export function useGetConversation() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Conversation | null>({
    queryKey: ['conversation'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getConversation();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}

// ─── Forum Posts ──────────────────────────────────────────────────────────────

export function useGetForumPosts(sortByVotes: boolean = false) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['forumPosts', sortByVotes],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getForumPosts(sortByVotes);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, symbols }: { content: string; symbols: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPost(content, symbols);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumPosts'] });
    },
  });
}

export function useUpvotePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (index: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.upvotePost(index);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumPosts'] });
    },
  });
}

// ─── Market Alerts ────────────────────────────────────────────────────────────

/**
 * Synthesizes a short two-tone chime using the Web Audio API.
 * No external audio files are used.
 */
function playAlertChime(): void {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    const playTone = (frequency: number, startTime: number, duration: number, gainPeak: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startTime);

      // Envelope: quick attack, short sustain, smooth release
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gainPeak, startTime + 0.02);
      gainNode.gain.setValueAtTime(gainPeak, startTime + duration * 0.4);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);

      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
    };

    const now = ctx.currentTime;
    // First note: higher pitch
    playTone(880, now, 0.18, 0.35);
    // Second note: slightly lower, overlapping
    playTone(1100, now + 0.12, 0.22, 0.28);

    // Close context after chime finishes to free resources
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 600);
  } catch {
    // Silently ignore if Web Audio API is unavailable
  }
}

export function useMarketAlerts() {
  const { actor, isFetching: actorFetching } = useActor();

  // Track alert IDs that have already triggered a sound
  const seenAlertIdsRef = useRef<Set<string>>(new Set());
  // Track whether this is the very first successful fetch (skip sound on initial load)
  const isFirstFetchRef = useRef<boolean>(true);

  const query = useQuery<Alert[]>({
    queryKey: ['marketAlerts'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMarketAlerts();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!query.data) return;

    const alerts = query.data;

    // Filter to only critical/high severity alerts
    const urgentAlerts = alerts.filter(
      (alert) =>
        alert.severity === Variant_high_critical_medium.critical ||
        alert.severity === Variant_high_critical_medium.high
    );

    if (isFirstFetchRef.current) {
      // On the first successful fetch, just record all existing IDs without playing sound
      urgentAlerts.forEach((alert) => {
        seenAlertIdsRef.current.add(alert.id.toString());
      });
      isFirstFetchRef.current = false;
      return;
    }

    // Find any urgent alerts we haven't seen before
    const newUrgentAlerts = urgentAlerts.filter(
      (alert) => !seenAlertIdsRef.current.has(alert.id.toString())
    );

    if (newUrgentAlerts.length > 0) {
      // Mark them as seen
      newUrgentAlerts.forEach((alert) => {
        seenAlertIdsRef.current.add(alert.id.toString());
      });
      // Play the notification chime once for all new urgent alerts
      playAlertChime();
    }
  }, [query.data]);

  return {
    ...query,
    data: query.data ?? [],
    isLoading: actorFetching || query.isLoading,
  };
}
