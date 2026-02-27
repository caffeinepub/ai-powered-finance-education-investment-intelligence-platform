import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Alert {
    id: bigint;
    sentimentScore: number;
    headline: string;
    relatedSymbols: Array<string>;
    triggeredAt: Time;
    severity: Variant_high_critical_medium;
}
export interface LeaderboardEntry {
    displayName: string;
    accuracyRate: number;
}
export type StockSymbol = string;
export type Time = bigint;
export interface Prediction {
    result: string;
    direction: string;
    stockSymbol: string;
    user: UserID;
    actualOutcome: string;
    aiPrediction: string;
}
export interface QuizResult {
    score: bigint;
    takenAt: Time;
}
export type UserID = Principal;
export interface Holding {
    shares: bigint;
    avgBuyPrice: number;
    symbol: string;
}
export interface Post {
    symbols: Array<string>;
    content: string;
    votes: bigint;
    author: UserID;
    timestamp: Time;
}
export interface LearningProgressView {
    scores: Array<[string, bigint]>;
    lastUpdated: Time;
    completedLessons: bigint;
}
export interface UserProfileView {
    hasPassword: boolean;
    displayName: string;
    predictionAccuracy: number;
    portfolioRef?: bigint;
    quizResults: Array<[string, QuizResult]>;
    lessonsCompleted: bigint;
}
export interface Portfolio {
    totalValue: number;
    holdings: Array<Holding>;
    riskScore: bigint;
}
export interface NewsArticle {
    _id: bigint;
    title: string;
    symbols: Array<string>;
    date: Time;
    marketImpact: bigint;
    sentiment: string;
    score: bigint;
    summary: string;
}
export interface Message {
    content: string;
    sender: UserID;
    timestamp: Time;
}
export interface UserProfileInput {
    displayName: string;
    predictionAccuracy: number;
    portfolioRef?: bigint;
    lessonsCompleted: bigint;
}
export interface Conversation {
    messages: Array<Message>;
    lastUpdated: Time;
}
export interface LearningProgress {
    lastUpdated: Time;
    completedLessons: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_high_critical_medium {
    high = "high",
    critical = "critical",
    medium = "medium"
}
export interface backendInterface {
    addNewsArticleWithScore(article: NewsArticle): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPost(content: string, symbols: Array<string>): Promise<void>;
    getArticlesByDateRange(startTime: Time, endTime: Time): Promise<Array<NewsArticle>>;
    getArticlesBySentiment(sentiment: string): Promise<Array<NewsArticle>>;
    getArticlesBySymbol(symbol: string): Promise<Array<NewsArticle>>;
    getCallerUserProfile(): Promise<UserProfileView | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversation(): Promise<Conversation | null>;
    getForumPosts(sortByVotes: boolean): Promise<Array<Post>>;
    getLearningProgress(): Promise<LearningProgressView | null>;
    getMarketAlerts(): Promise<Array<Alert>>;
    getNewsArticle(id: bigint): Promise<NewsArticle | null>;
    getNewsArticles(): Promise<Array<NewsArticle>>;
    getPortfolio(): Promise<Portfolio | null>;
    getPublicLeaderboard(): Promise<Array<LeaderboardEntry>>;
    getPublicMarketAlerts(): Promise<Array<Alert>>;
    getPublicNewsFeed(): Promise<Array<NewsArticle>>;
    getPublicStockList(): Promise<Array<StockSymbol>>;
    getSentimentImpactTimeline(symbol: string): Promise<Array<[Time, bigint]>>;
    getSummaryStatistics(): Promise<{
        negativeCount: bigint;
        positiveCount: bigint;
        neutralCount: bigint;
        averageScore: number;
    }>;
    getTopPosts(): Promise<Array<Post>>;
    getUserPredictions(): Promise<Array<Prediction>>;
    getUserProfile(user: Principal): Promise<UserProfileView | null>;
    initializeNewsDatabase(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profileInput: UserProfileInput): Promise<void>;
    saveLearningProgress(progress: LearningProgress): Promise<void>;
    savePortfolio(portfolio: Portfolio): Promise<void>;
    sendMessage(content: string): Promise<void>;
    setUserPassword(passwordHash: string): Promise<boolean>;
    submitPrediction(prediction: Prediction): Promise<void>;
    upvotePost(index: bigint): Promise<void>;
    verifyUserPassword(passwordHash: string): Promise<boolean>;
}
