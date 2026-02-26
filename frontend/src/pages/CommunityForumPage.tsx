import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetForumPosts, useCreatePost, useUpvotePost, useGetCallerUserProfile } from '../hooks/useQueries';
import ForumPostCard from '../components/ForumPostCard';
import CreatePostModal from '../components/CreatePostModal';
import GlassCard from '../components/GlassCard';
import { Button } from '@/components/ui/button';
import { Users, Plus, TrendingUp, Clock, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CommunityForumPage() {
  const { identity } = useInternetIdentity();
  const [sortByVotes, setSortByVotes] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data: profile } = useGetCallerUserProfile();

  const { data: posts = [], isLoading } = useGetForumPosts(sortByVotes);
  const createPost = useCreatePost();
  const upvotePost = useUpvotePost();

  const handleCreatePost = async (content: string, symbols: string[]) => {
    await createPost.mutateAsync({ content, symbols });
    setShowCreateModal(false);
  };

  const handleUpvote = (index: bigint) => {
    upvotePost.mutate(index);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
            <Users className="h-4 w-4" />
            Community Forum
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Investor Community</h1>
          <p className="text-muted-foreground">
            Share insights, discuss strategies, and learn from fellow investors.
          </p>
        </div>
        {identity && (
          <Button onClick={() => setShowCreateModal(true)} className="btn-teal gap-2">
            <Plus className="h-4 w-4" />
            Post Insight
          </Button>
        )}
      </div>

      {/* Stats & Sort */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GlassCard className="px-4 py-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{posts.length} Posts</span>
          </GlassCard>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSortByVotes(false)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              !sortByVotes ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            Latest
          </button>
          <button
            onClick={() => setSortByVotes(true)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              sortByVotes ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Top Voted
          </button>
        </div>
      </div>

      {/* Login prompt for guests */}
      {!identity && (
        <GlassCard className="mb-6 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Join the conversation</p>
              <p className="text-xs text-muted-foreground">Log in to post insights and upvote community content.</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Posts Feed */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <GlassCard className="text-center py-20">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">No Posts Yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Be the first to share your market insights with the community!
          </p>
          {identity && (
            <Button onClick={() => setShowCreateModal(true)} className="btn-teal gap-2">
              <Plus className="h-4 w-4" />
              Share First Insight
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => (
            <ForumPostCard
              key={i}
              post={post}
              index={i}
              onUpvote={handleUpvote}
              isUpvoting={upvotePost.isPending}
              authorName={post.author.toString() === identity?.getPrincipal().toString() ? (profile?.displayName ?? undefined) : undefined}
            />
          ))}
        </div>
      )}

      <CreatePostModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePost}
        isLoading={createPost.isPending}
      />
    </div>
  );
}
