import React, { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { learningTopics } from '../data/learningTopics';
import { useGetLearningProgress, useSaveLearningProgress } from '../hooks/useQueries';
import GlassCard from '../components/GlassCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Trophy, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TopicQuizPage() {
  const { topicId } = useParams({ from: '/learn/$topicId/quiz' });
  const topic = learningTopics.find(t => t.id === topicId);
  const { data: progress } = useGetLearningProgress();
  const saveProgress = useSaveLearningProgress();

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(topic?.quiz.length ?? 0).fill(null)
  );
  const [showResult, setShowResult] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const questions = topic.quiz;
  const question = questions[currentQ];
  const totalQ = questions.length;

  const handleSelect = (idx: number) => {
    if (submitted) return;
    setSelected(idx);
  };

  const handleNext = () => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = selected;
    setAnswers(newAnswers);

    if (currentQ < totalQ - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(newAnswers[currentQ + 1] ?? null);
      setSubmitted(false);
    } else {
      handleSubmitQuiz(newAnswers);
    }
  };

  const handleSubmitAnswer = () => {
    if (selected === null) return;
    setSubmitted(true);
  };

  const handleSubmitQuiz = async (finalAnswers: (number | null)[]) => {
    const topicIndex = learningTopics.findIndex(t => t.id === topicId);
    const currentCompleted = progress ? Number(progress.completedLessons) : 0;
    const newCompleted = Math.max(currentCompleted, topicIndex + 1);

    try {
      await saveProgress.mutateAsync({
        completedLessons: BigInt(newCompleted),
        lastUpdated: BigInt(Date.now()) * BigInt(1_000_000),
      });
    } catch {
      // Continue even if save fails
    }
    setShowResult(true);
  };

  const finalScore = answers.filter((a, i) => a === questions[i]?.correctIndex).length;
  const scorePercent = Math.round((finalScore / totalQ) * 100);

  if (showResult) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <GlassCard className="text-center py-10">
          <div className="mb-6">
            {scorePercent >= 70 ? (
              <Trophy className="h-16 w-16 text-gold mx-auto mb-4" />
            ) : (
              <RotateCcw className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            )}
            <h2 className="font-display text-3xl font-bold text-foreground mb-2">
              {scorePercent >= 70 ? 'Great Job!' : 'Keep Practicing!'}
            </h2>
            <p className="text-muted-foreground">
              You scored{' '}
              <span className="text-primary font-bold">
                {finalScore}/{totalQ}
              </span>{' '}
              ({scorePercent}%)
            </p>
          </div>

          <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center mx-auto mb-8">
            <span className="font-display text-3xl font-bold text-primary">{scorePercent}%</span>
          </div>

          <div className="space-y-3 mb-8 text-left">
            {questions.map((q, i) => {
              const userAnswer = answers[i];
              const isCorrect = userAnswer === q.correctIndex;
              return (
                <div
                  key={i}
                  className={cn(
                    'p-3 rounded-lg border text-sm',
                    isCorrect
                      ? 'bg-emerald-400/5 border-emerald-400/20'
                      : 'bg-red-400/5 border-red-400/20'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-foreground font-medium mb-1">{q.question}</p>
                      {!isCorrect && (
                        <p className="text-xs text-muted-foreground">{q.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <Link to="/learn">
              <Button variant="outline" className="border-border/50">
                Back to Topics
              </Button>
            </Link>
            <Button
              onClick={() => {
                setCurrentQ(0);
                setSelected(null);
                setAnswers(new Array(totalQ).fill(null));
                setShowResult(false);
                setSubmitted(false);
              }}
              className="btn-teal"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link
          to="/learn/$topicId"
          params={{ topicId }}
          className="hover:text-primary transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {topic.title}
        </Link>
        <span>/</span>
        <span className="text-foreground">Assessment</span>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Question {currentQ + 1} of {totalQ}
          </span>
          <Badge variant="outline" className="text-xs border-border/50">
            {topic.title}
          </Badge>
        </div>
        <Progress
          value={((currentQ + (submitted ? 1 : 0)) / totalQ) * 100}
          className="h-1.5"
        />
      </div>

      {/* Question */}
      <GlassCard className="mb-6">
        <h2 className="font-display text-lg font-semibold text-foreground mb-6 leading-snug">
          {question.question}
        </h2>

        <div className="space-y-3">
          {question.options.map((option, idx) => {
            let optionClass =
              'border-border/40 hover:border-primary/40 hover:bg-primary/5 cursor-pointer';
            if (submitted) {
              if (idx === question.correctIndex) {
                optionClass = 'border-emerald-400/50 bg-emerald-400/10 cursor-default';
              } else if (idx === selected && idx !== question.correctIndex) {
                optionClass = 'border-red-400/50 bg-red-400/10 cursor-default';
              } else {
                optionClass = 'border-border/20 opacity-50 cursor-default';
              }
            } else if (selected === idx) {
              optionClass = 'border-primary/60 bg-primary/10 cursor-pointer';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={submitted}
                className={cn(
                  'w-full text-left p-4 rounded-lg border transition-all duration-150 flex items-center gap-3',
                  optionClass
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold',
                    selected === idx && !submitted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/50 text-muted-foreground',
                    submitted && idx === question.correctIndex
                      ? 'border-emerald-400 bg-emerald-400 text-white'
                      : '',
                    submitted && idx === selected && idx !== question.correctIndex
                      ? 'border-red-400 bg-red-400 text-white'
                      : ''
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-sm text-foreground">{option}</span>
                {submitted && idx === question.correctIndex && (
                  <CheckCircle className="h-4 w-4 text-emerald-400 ml-auto shrink-0" />
                )}
                {submitted && idx === selected && idx !== question.correctIndex && (
                  <XCircle className="h-4 w-4 text-red-400 ml-auto shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {submitted && (
          <div className="mt-4 p-3 rounded-lg bg-secondary/30 border border-border/30 animate-fade-in">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Explanation: </span>
              {question.explanation}
            </p>
          </div>
        )}
      </GlassCard>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (currentQ > 0) {
              setCurrentQ(currentQ - 1);
              setSelected(answers[currentQ - 1] ?? null);
              setSubmitted(answers[currentQ - 1] !== null);
            }
          }}
          disabled={currentQ === 0}
          className="border-border/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {!submitted ? (
          <Button onClick={handleSubmitAnswer} disabled={selected === null} className="btn-teal">
            Check Answer
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="btn-teal gap-2"
            disabled={saveProgress.isPending && currentQ === totalQ - 1}
          >
            {saveProgress.isPending && currentQ === totalQ - 1 ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {currentQ < totalQ - 1 ? 'Next Question' : 'See Results'}
            {currentQ < totalQ - 1 && <ArrowRight className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}
