import React from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { learningTopics } from '../data/learningTopics';
import { useGetLearningProgress } from '../hooks/useQueries';
import GlassCard from '../components/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Clock, CheckCircle, BookOpen } from 'lucide-react';

export default function TopicLessonPage() {
  const { topicId } = useParams({ from: '/learn/$topicId' });
  const topic = learningTopics.find(t => t.id === topicId);
  const { data: progress } = useGetLearningProgress();

  if (!topic) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-2xl font-bold text-foreground mb-3">Topic Not Found</h2>
        <Link to="/learn">
          <Button variant="outline">Back to Learning</Button>
        </Link>
      </div>
    );
  }

  const topicIndex = learningTopics.findIndex(t => t.id === topicId);
  const completedCount = progress ? Number(progress.completedLessons) : 0;
  const isCompleted = topicIndex < completedCount;

  // Render markdown-like content
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('## ')) {
        return (
          <h2 key={i} className="font-display text-xl font-bold text-foreground mt-6 mb-3">
            {line.slice(3)}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={i} className="font-display text-lg font-semibold text-primary mt-5 mb-2">
            {line.slice(4)}
          </h3>
        );
      }
      if (line.startsWith('#### ')) {
        return (
          <h4 key={i} className="font-semibold text-foreground mt-4 mb-2">
            {line.slice(5)}
          </h4>
        );
      }
      if (line.startsWith('- **')) {
        const match = line.match(/^- \*\*(.+?)\*\*: (.+)$/);
        if (match) {
          return (
            <li key={i} className="text-sm text-muted-foreground mb-1 ml-4">
              <span className="font-semibold text-foreground">{match[1]}</span>: {match[2]}
            </li>
          );
        }
      }
      if (line.startsWith('- ')) {
        return (
          <li key={i} className="text-sm text-muted-foreground mb-1 ml-4 list-disc">
            {line.slice(2)}
          </li>
        );
      }
      if (/^\d+\. /.test(line)) {
        const match = line.match(/^(\d+)\. (.+)$/);
        if (match) {
          return (
            <li key={i} className="text-sm text-muted-foreground mb-1 ml-4 list-decimal">
              {match[2].replace(/\*\*(.+?)\*\*/g, '$1')}
            </li>
          );
        }
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={i} className="font-semibold text-foreground mt-3 mb-1">
            {line.slice(2, -2)}
          </p>
        );
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      // Inline bold
      const parts = line.split(/\*\*(.+?)\*\*/g);
      if (parts.length > 1) {
        return (
          <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-1">
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="text-foreground font-semibold">
                  {part}
                </strong>
              ) : (
                part
              )
            )}
          </p>
        );
      }
      return (
        <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-1">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link
          to="/learn"
          className="hover:text-primary transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Learning
        </Link>
        <span>/</span>
        <span className="text-foreground">{topic.title}</span>
      </div>

      {/* Header */}
      <GlassCard className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{topic.icon}</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-2xl font-bold text-foreground">{topic.title}</h1>
                {isCompleted && <CheckCircle className="h-5 w-5 text-emerald-400" />}
              </div>
              <p className="text-muted-foreground text-sm mb-3">{topic.description}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {topic.estimatedMinutes} min read
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BookOpen className="h-3 w-3" />
                  {topic.quiz.length} quiz questions
                </div>
                {isCompleted && (
                  <Badge className="text-xs bg-emerald-400/10 text-emerald-400 border-emerald-400/20">
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Content */}
      <GlassCard className="mb-8">
        <div className="space-y-1">{renderContent(topic.content)}</div>
      </GlassCard>

      {/* CTA */}
      <div className="flex items-center justify-between">
        <Link to="/learn">
          <Button variant="outline" className="border-border/50 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Topics
          </Button>
        </Link>
        <Link to="/learn/$topicId/quiz" params={{ topicId: topic.id }}>
          <Button className="btn-teal gap-2">
            Take Assessment
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
