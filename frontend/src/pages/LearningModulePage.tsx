import React from 'react';
import { Link } from '@tanstack/react-router';
import { learningTopics } from '../data/learningTopics';
import { useGetLearningProgress } from '../hooks/useQueries';
import GlassCard from '../components/GlassCard';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, ArrowRight, BookOpen } from 'lucide-react';

export default function LearningModulePage() {
  const { data: progress, isLoading } = useGetLearningProgress();

  const completedCount = progress ? Number(progress.completedLessons) : 0;
  const totalTopics = learningTopics.length;
  const progressPercent = Math.round((completedCount / totalTopics) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
          <BookOpen className="h-4 w-4" />
          Finance Learning
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Learning Modules</h1>
        <p className="text-muted-foreground">
          Master financial concepts through structured lessons and assessments.
        </p>
      </div>

      {/* Progress Overview */}
      <GlassCard className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Overall Progress</span>
              <span className="text-sm font-bold text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {completedCount} of {totalTopics} topics completed
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <div className="text-2xl font-bold font-display text-teal">{completedCount}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-display text-gold">
                {totalTopics - completedCount}
              </div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Topics Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
              <div className="h-10 w-10 rounded-lg bg-secondary/50 mb-4" />
              <div className="h-5 bg-secondary/50 rounded mb-2 w-3/4" />
              <div className="h-4 bg-secondary/30 rounded mb-1 w-full" />
              <div className="h-4 bg-secondary/30 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {learningTopics.map((topic, idx) => {
            const isCompleted = idx < completedCount;
            return (
              <Link
                key={topic.id}
                to="/learn/$topicId"
                params={{ topicId: topic.id }}
              >
                <GlassCard
                  hover
                  glow={topic.color === 'teal' ? 'teal' : 'gold'}
                  className="h-full group relative"
                >
                  {isCompleted && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                  )}
                  <div className="text-3xl mb-3">{topic.icon}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                      {topic.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {topic.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {topic.estimatedMinutes} min
                    </div>
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <Badge className="text-xs bg-emerald-400/10 text-emerald-400 border-emerald-400/20">
                          Completed
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-primary font-medium">
                          Start{' '}
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
