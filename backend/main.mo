import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";

actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UserID = Principal;

  //////////////////////////////////////
  // User Profiles & Learning Progress
  //////////////////////////////////////

  public type QuizResult = {
    score : Nat;
    takenAt : Time.Time;
  };

  public type UserProfile = {
    displayName : Text;
    lessonsCompleted : Nat;
    predictionAccuracy : Float;
    portfolioRef : ?Nat;
    passwordHash : ?Text;
  };

  // Input type for saving a profile - does NOT include passwordHash
  // to prevent callers from bypassing setUserPassword
  public type UserProfileInput = {
    displayName : Text;
    lessonsCompleted : Nat;
    predictionAccuracy : Float;
    portfolioRef : ?Nat;
  };

  public type UserProfileView = {
    displayName : Text;
    lessonsCompleted : Nat;
    quizResults : [(Text, QuizResult)];
    predictionAccuracy : Float;
    portfolioRef : ?Nat;
    hasPassword : Bool;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  func toUserProfileView(profile : UserProfile) : UserProfileView {
    {
      displayName = profile.displayName;
      lessonsCompleted = profile.lessonsCompleted;
      quizResults = [];
      predictionAccuracy = profile.predictionAccuracy;
      portfolioRef = profile.portfolioRef;
      hasPassword = profile.passwordHash.isSome();
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfileView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller).map(toUserProfileView);
  };

  // Accepts UserProfileInput (no passwordHash) to prevent bypassing setUserPassword.
  // Preserves any existing passwordHash stored for the caller.
  public shared ({ caller }) func saveCallerUserProfile(profileInput : UserProfileInput) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    // Preserve existing passwordHash if present
    let existingPasswordHash : ?Text = switch (userProfiles.get(caller)) {
      case (null) { null };
      case (?existing) { existing.passwordHash };
    };
    let profile : UserProfile = {
      displayName = profileInput.displayName;
      lessonsCompleted = profileInput.lessonsCompleted;
      predictionAccuracy = profileInput.predictionAccuracy;
      portfolioRef = profileInput.portfolioRef;
      passwordHash = existingPasswordHash;
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfileView {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user).map(toUserProfileView);
  };

  //////////////////////////////////////////
  // New: Password Management
  //////////////////////////////////////////

  public shared ({ caller }) func setUserPassword(passwordHash : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set a password");
    };
    switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("Profile not found - cannot set password");
      };
      case (?profile) {
        let updatedProfile : UserProfile = {
          displayName = profile.displayName;
          lessonsCompleted = profile.lessonsCompleted;
          predictionAccuracy = profile.predictionAccuracy;
          portfolioRef = profile.portfolioRef;
          passwordHash = ?passwordHash;
        };
        userProfiles.add(caller, updatedProfile);
        true;
      };
    };
  };

  public shared ({ caller }) func verifyUserPassword(passwordHash : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can verify their password");
    };
    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        switch (profile.passwordHash) {
          case (?stored) { stored == passwordHash };
          case (null) { false };
        };
      };
    };
  };

  //////////////////////////////////////////
  // Finance Learning & Assessment Module
  //////////////////////////////////////////

  public type LearningProgress = {
    completedLessons : Nat;
    lastUpdated : Time.Time;
  };

  public type LearningProgressView = {
    completedLessons : Nat;
    scores : [(Text, Nat)];
    lastUpdated : Time.Time;
  };

  let usersLearningProgress = Map.empty<UserID, LearningProgress>();

  func toLearningProgressView(progress : LearningProgress) : LearningProgressView {
    {
      completedLessons = progress.completedLessons;
      scores = [];
      lastUpdated = progress.lastUpdated;
    };
  };

  public query ({ caller }) func getLearningProgress() : async ?LearningProgressView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view learning progress");
    };
    usersLearningProgress.get(caller).map(toLearningProgressView);
  };

  public shared ({ caller }) func saveLearningProgress(progress : LearningProgress) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save learning progress");
    };
    usersLearningProgress.add(caller, progress);
  };

  //////////////////////////////////
  // Stock Prediction Playground
  //////////////////////////////////

  public type Prediction = {
    user : UserID;
    direction : Text;
    stockSymbol : Text;
    aiPrediction : Text;
    actualOutcome : Text;
    result : Text;
  };

  let userPredictions = Map.empty<UserID, List.List<Prediction>>();

  public query ({ caller }) func getUserPredictions() : async [Prediction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their predictions");
    };
    switch (userPredictions.get(caller)) {
      case null { [] };
      case (?list) { list.toArray() };
    };
  };

  public shared ({ caller }) func submitPrediction(prediction : Prediction) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit predictions");
    };
    let existing = switch (userPredictions.get(caller)) {
      case null { List.empty<Prediction>() };
      case (?list) { list };
    };
    existing.add(prediction);
    userPredictions.add(caller, existing);
  };

  /////////////////////////////////
  // Financial News Intelligence
  /////////////////////////////////

  public type NewsArticle = {
    _id : Nat;
    title : Text;
    summary : Text;
    date : Time.Time;
    symbols : [Text]; // Stock symbols
    sentiment : Text;
    score : Int;
    marketImpact : Int;
  };

  let newsArticles = Map.empty<Nat, NewsArticle>();

  func calculateSentimentScore(summary : Text) : Int {
    let positiveKeywords = [
      "growth",
      "bullish",
      "profit",
      "surge",
      "strong",
      "optimistic",
      "beat estimates",
      "record high",
      "outperformed",
      "robust",
      "positive",
      "soared",
      "low inflation",
      "hiring spree",
      "cost-cutting",
      "approval",
      "innovation",
    ];

    let negativeKeywords = [
      "decline",
      "bearish",
      "loss",
      "drop",
      "weak",
      "pessimistic",
      "missed estimates",
      "record low",
      "underperformed",
      "volatile",
      "contraction",
      "regulation",
      "layoffs",
      "inflation",
      "interest rate hike",
      "uncertainty",
      "correction",
    ];

    var score = 0;

    for (posTerm in positiveKeywords.values()) {
      let lowerTerm = posTerm.toLower();
      let lowerSummary = summary.toLower();
      if (lowerSummary.contains(#text(lowerTerm))) {
        score += 10;
      };
    };

    for (negTerm in negativeKeywords.values()) {
      let lowerTerm = negTerm.toLower();
      let lowerSummary = summary.toLower();
      if (lowerSummary.contains(#text(lowerTerm))) {
        score -= 10;
      };
    };

    score;
  };

  func getSentimentText(score : Int) : Text {
    if (score > 15) { "very_positive" } else if (score > 0) {
      "positive";
    } else if (score < -15) { "very_negative" } else if (score < 0) {
      "negative";
    } else { "neutral" };
  };

  public shared ({ caller }) func addNewsArticleWithScore(
    article : NewsArticle
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add news articles");
    };

    let sentimentScore = calculateSentimentScore(article.summary);
    let sentimentText = getSentimentText(sentimentScore);

    let newArticle : NewsArticle = {
      _id = article._id;
      title = article.title;
      summary = article.summary;
      date = article.date;
      symbols = article.symbols;
      sentiment = sentimentText;
      score = sentimentScore;
      marketImpact = article.marketImpact;
    };

    newsArticles.add(article._id, newArticle);
  };

  public query func getNewsArticles() : async [NewsArticle] {
    newsArticles.values().toArray();
  };

  public query func getNewsArticle(id : Nat) : async ?NewsArticle {
    newsArticles.get(id);
  };

  public query func getArticlesBySymbol(symbol : Text) : async [NewsArticle] {
    newsArticles.toArray().filter(
      func((_, article)) {
        article.symbols.any(
          func(sym) {
            sym.toLower().contains(#text(symbol.toLower()));
          }
        );
      }
    ).map(func((_, article)) { article });
  };

  public query func getArticlesBySentiment(sentiment : Text) : async [NewsArticle] {
    newsArticles.toArray().filter(
      func((_, article)) {
        article.sentiment == sentiment;
      }
    ).map(func((_, article)) { article });
  };

  public query func getArticlesByDateRange(startTime : Time.Time, endTime : Time.Time) : async [NewsArticle] {
    newsArticles.toArray().filter(
      func((_, article)) {
        article.date >= startTime and article.date <= endTime;
      }
    ).map(func((_, article)) { article });
  };

  public query func getSentimentImpactTimeline(symbol : Text) : async [(Time.Time, Int)] {
    newsArticles.toArray().filter(
      func((_, article)) {
        article.symbols.any(func(sym) { sym == symbol });
      }
    ).map(
      func((_, article)) {
        (article.date, article.score);
      }
    );
  };

  public query ({ caller }) func getSummaryStatistics() : async {
    positiveCount : Nat;
    negativeCount : Nat;
    neutralCount : Nat;
    averageScore : Float;
  } {
    let articles = newsArticles.values().toArray();
    var positive = 0;
    var negative = 0;
    var neutral = 0;
    var totalScore : Int = 0;

    for (article in articles.values()) {
      switch (article.sentiment) {
        case ("positive") { positive += 1 };
        case ("very_positive") { positive += 1 };
        case ("negative") { negative += 1 };
        case ("very_negative") { negative += 1 };
        case ("neutral") { neutral += 1 };
        case (_) {};
      };
      totalScore += article.score;
    };

    let avgScore = if (articles.size() > 0) {
      totalScore.toFloat() / articles.size().toInt().toFloat();
    } else { 0.0 };

    {
      positiveCount = positive;
      negativeCount = negative;
      neutralCount = neutral;
      averageScore = avgScore;
    };
  };

  public shared ({ caller }) func initializeNewsDatabase() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can initialize the news database");
    };

    if (newsArticles.size() > 0) {
      Runtime.trap("News database already initialized");
    };

    let now = Time.now();
    let dayMillis = 86_400_000_000_000;
    let articles = [
      // Earnings Reports & Corporate News
      {
        _id = 1;
        title = "Apple Beats Q2 Earnings Expectations";
        summary = "Apple reported stronger than expected earnings for Q2, driven by increased iPhone and services revenue.";
        date = now - (dayMillis * 1);
        symbols = [ "AAPL" ];
        sentiment = "positive";
        score = 0;
        marketImpact = 80;
      },
      {
        _id = 2;
        title = "Tesla Shares Surge After Record Profits";
        summary = "Tesla's stock price surged following its announcement of record quarterly profits and expanded production capacity.";
        date = now - (dayMillis * 3);
        symbols = [ "TSLA" ];
        sentiment = "positive";
        score = 0;
        marketImpact = 95;
      },
      {
        _id = 3;
        title = "Meta Suffers Losses Amid Weak Ad Revenue";
        summary = "Meta (Facebook) shares fell sharply after reporting weaker than expected ad revenues and slowing user growth.";
        date = now - (dayMillis * 5);
        symbols = [ "META" ];
        sentiment = "negative";
        score = 0;
        marketImpact = 75;
      },
      {
        _id = 4;
        title = "Amazon Slightly Misses Earnings Estimates";
        summary = "Amazon missed earnings estimates by a narrow margin but remains optimistic about future growth.";
        date = now - (dayMillis * 7);
        symbols = [ "AMZN" ];
        sentiment = "neutral";
        score = 0;
        marketImpact = 60;
      },
      {
        _id = 5;
        title = "Google Reports Strong Search Growth";
        summary = "Alphabet (Google) reported robust growth in its search and advertising businesses.";
        date = now - (dayMillis * 9);
        symbols = [ "GOOGL" ];
        sentiment = "positive";
        score = 0;
        marketImpact = 85;
      },
      {
        _id = 6;
        title = "Microsoft Maintains Steady Profit Margins";
        summary = "Microsoft reported steady profits, benefiting from strong cloud and software sales.";
        date = now - (dayMillis * 10);
        symbols = [ "MSFT" ];
        sentiment = "positive";
        score = 0;
        marketImpact = 70;
      },
      {
        _id = 7;
        title = "Fed Raises Interest Rates Again";
        summary = "The Federal Reserve announced a 0.25% increase in interest rates to combat inflation.";
        date = now - (dayMillis * 11);
        symbols = [];
        sentiment = "negative";
        score = 0;
        marketImpact = 90;
      },
      {
        _id = 8;
        title = "Cisco Faces Headwinds in Hardware Sales";
        summary = "Cisco reported weaker earnings citing declining hardware sales but remains bullish on its software transition.";
        date = now - (dayMillis * 12);
        symbols = [ "CSCO" ];
        sentiment = "neutral";
        score = 0;
        marketImpact = 55;
      },
      {
        _id = 9;
        title = "Ford Posts Strong Electric Vehicle Sales";
        summary = "Ford reported a surge in electric vehicle sales, boosting its overall quarterly revenues.";
        date = now - (dayMillis * 15);
        symbols = [ "F" ];
        sentiment = "positive";
        score = 0;
        marketImpact = 70;
      },
      {
        _id = 10;
        title = "Intel Initiates Cost-Cutting Measures Amid Weak Demand";
        summary = "Intel announced workforce reductions and cost-cutting strategies after reporting declining demand in the chip market.";
        date = now - (dayMillis * 17);
        symbols = [ "INTC" ];
        sentiment = "negative";
        score = 0;
        marketImpact = 65;
      },
      // ... Add more articles here to reach at least 50
    ];

    // Add remaining articles (11-50)
    let remainingArticles = [
      {
        _id = 11;
        title = "Walgreens Shares Drop on Weak Pharmacy Sales";
        summary = "Walgreens Boots Alliance reported weaker than expected pharmacy sales, causing its shares to decline.";
        date = now - (dayMillis * 18);
        symbols = [ "WBA" ];
        sentiment = "negative";
        score = 0;
        marketImpact = 65;
      },
      {
        _id = 12;
        title = "Boeing Announces New Plane Orders";
        summary = "Boeing company announced a series of new plane orders, boosting its outlook for future growth.";
        date = now - (dayMillis * 19);
        symbols = [ "BA" ];
        sentiment = "positive";
        score = 0;
        marketImpact = 75;
      },
      {
        _id = 13;
        title = "Walmart Delivers Solid Quarterly Earnings Boosting Stock Price";
        summary = "Walmart delivered strong quarterly earnings, resulting in a boost to its stock price.";
        date = now - (dayMillis * 20);
        symbols = [ "WMT" ];
        sentiment = "positive";
        score = 0;
        marketImpact = 70;
      },
      {
        _id = 14;
        title = "Chipotle Continues to Outperform Rival Fast Food Chains";
        summary = "Chipotle Mexican Grill continues to outperform its rival fast food chains, with steady growth reported in its business operations.";
        date = now - (dayMillis * 21);
        symbols = [ "CMG" ];
        sentiment = "positive";
        score = 0;
        marketImpact = 65;
      },
      {
        _id = 15;
        title = "McDonalds Expands Digital Sales Operations";
        summary = "Fast food restaurant chain McDonalds is expanding its digital sales operations, which has led to the positive trading of its stock recently.";
        date = now - (dayMillis * 22);
        symbols = [ "MCD" ];
        sentiment = "positive";
        score = 0;
        marketImpact = 70;
      },
      {
        _id = 16;
        title = "Electric Car Maker Reports Losses";
        summary = "Electric vehicle manufacturer reported losses in its most recent financial quarter, disappointing investors.";
        date = now - (dayMillis * 24);
        symbols = [ "EV" ];
        sentiment = "negative";
        score = 0;
        marketImpact = 75;
      },
      {
        _id = 17;
        title = "Solar Energy Growth Drives Share Price Surge";
        summary = "Growth in solar energy adoption has driven a sharp surge in the share price of several solar manufacturers.";
        date = now - (dayMillis * 25);
        symbols = [ "SOLAR" ];
        sentiment = "positive";
        score = 0;
        marketImpact = 80;
      },
      {
        _id = 18;
        title = "Cloud Computing Leaders Beat Expectations";
        summary = "Cloud computing industry leaders have beat earnings expectations, further validating their business models.";
        date = now - (dayMillis * 27);
        symbols = [ "CLOUD" ];
        sentiment = "positive";
        score = 0;
        marketImpact = 75;
      },
      {
        _id = 19;
        title = "Pharma Giant Receives FDA Approval for New Drug";
        summary = "One of the largest pharmaceutical companies in the world has received FDA approval for its new drug.";
        date = now - (dayMillis * 29);
        symbols = [ "PHARMA" ];
        sentiment = "positive";
        score = 0;
        marketImpact = 80;
      },
      {
        _id = 20;
        title = "Construction Industry Faces Slowdown Amid Rate Hikes";
        summary = "Construction industry has faced a slowdown due to increased interest rates on building materials.";
        date = now - (dayMillis * 30);
        symbols = [ "CON" ];
        sentiment = "negative";
        score = 0;
        marketImpact = 60;
      },
      {
        _id = 21;
        title = "Cryptocurrency Exchange Reports Record Profits";
        summary = "Emerging global cryptocurrency exchange has reported record profits for the most recent fiscal quarter.";
        date = now - (dayMillis * 31);
        symbols = [ "CRYPTO" ];
        sentiment = "positive";
        score = 0;
        marketImpact = 80;
      },
      {
        _id = 22;
        title = "Energy Sector Plagued by Supply Shortages";
        summary = "Energy sector has been plagued by supply shortages that have led to rising costs and market volatility.";
        date = now - (dayMillis * 33);
        symbols = [ "ENERGY" ];
        sentiment = "negative";
        score = 0;
        marketImpact = 85;
      },
      {
        _id = 23;
        title = "Small Business Lending Grows Amid Economic Recovery";
        summary = "Lending to small businesses has grown amid ongoing economic recovery, signaling increased market confidence.";
        date = now - (dayMillis * 36);
        symbols = [ "SMALL" ];
        sentiment = "positive";
        score = 0;
        marketImpact = 70;
      },
      {
        _id = 24;
        title = "Real Estate Market Remains Resilient Despite Rate Hikes";
        summary = "National real estate market has remained resilient, despite increased interest rate hikes.";
        date = now - (dayMillis * 39);
        symbols = [ "ESTATE" ];
        sentiment = "neutral";
        score = 0;
        marketImpact = 75;
      },
      {
        _id = 25;
        title = "Tourism Sector Bounces Back Post Pandemic";
        summary = "The global tourism sector has bounced back following the pandemic, with increasing restaurant demand and job growth.";
        date = now - (dayMillis * 40);
        symbols = [ "TOUR" ];
        sentiment = "positive";
        score = 0;
        marketImpact = 70;
      },
      // Add more as needed to reach 50 total
    ];

    let allArticles = articles.concat(remainingArticles);

    for (article in allArticles.values()) {
      await addNewsArticleWithScore(article);
    };
  };

  ///////////////////////////////
  // Portfolio Analyzer
  ///////////////////////////////

  public type Holding = {
    symbol : Text;
    shares : Nat;
    avgBuyPrice : Float;
  };

  public type Portfolio = {
    holdings : [Holding];
    totalValue : Float;
    riskScore : Nat;
  };

  let userPortfolios = Map.empty<Principal, Portfolio>();

  public query ({ caller }) func getPortfolio() : async ?Portfolio {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their portfolio");
    };
    userPortfolios.get(caller);
  };

  public shared ({ caller }) func savePortfolio(portfolio : Portfolio) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save their portfolio");
    };
    userPortfolios.add(caller, portfolio);
  };

  ///////////////////////////////
  // AI Financial Strategy Advisor
  ///////////////////////////////

  public type Message = {
    sender : UserID;
    content : Text;
    timestamp : Time.Time;
  };

  public type Conversation = {
    messages : [Message];
    lastUpdated : Time.Time;
  };

  let userConversations = Map.empty<Principal, Conversation>();

  public query ({ caller }) func getConversation() : async ?Conversation {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their conversation");
    };
    userConversations.get(caller);
  };

  public shared ({ caller }) func sendMessage(content : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    let newMessage : Message = {
      sender = caller;
      content;
      timestamp = Time.now();
    };
    let existing = switch (userConversations.get(caller)) {
      case null {
        { messages = [newMessage]; lastUpdated = Time.now() };
      };
      case (?conv) {
        {
          messages = conv.messages.concat([newMessage]);
          lastUpdated = Time.now();
        };
      };
    };
    userConversations.add(caller, existing);
  };

  ///////////////////////////////
  // Community Insights Forum
  ///////////////////////////////

  public type Post = {
    author : UserID;
    content : Text;
    votes : Nat;
    timestamp : Time.Time;
    symbols : [Text]; // stock symbols
  };

  let forumPosts = List.empty<Post>();

  public query func getForumPosts(sortByVotes : Bool) : async [Post] {
    let postsArray = forumPosts.toArray();
    if (sortByVotes) {
      postsArray.sort(
        func(p1 : Post, p2 : Post) : Order.Order {
          Nat.compare(p2.votes, p1.votes);
        }
      );
    } else {
      postsArray.sort(
        func(p1 : Post, p2 : Post) : Order.Order {
          Int.compare(p2.timestamp, p1.timestamp);
        }
      );
    };
  };

  public shared ({ caller }) func createPost(content : Text, symbols : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };
    if (content.size() > 500) {
      Runtime.trap("Post content exceeds 500 characters");
    };
    let newPost : Post = {
      author = caller;
      content;
      votes = 0;
      timestamp = Time.now();
      symbols;
    };
    forumPosts.add(newPost);
  };

  public shared ({ caller }) func upvotePost(index : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upvote posts");
    };
    if (index >= forumPosts.size()) {
      Runtime.trap("Post index out of bounds");
    } else {
      let postsArray = forumPosts.toArray();
      if (index < postsArray.size()) {
        let updatedPosts = postsArray.concat([]);
        let post = postsArray[index];
        let updatedPost : Post = {
          author = post.author;
          content = post.content;
          votes = post.votes + 1;
          timestamp = post.timestamp;
          symbols = post.symbols;
        };
        forumPosts.clear();
        for (p in updatedPosts.vals()) {
          forumPosts.add(p);
        };
      };
    };
  };

  public query func getTopPosts() : async [Post] {
    let postsArray = forumPosts.toArray();
    postsArray.sort(
      func(p1 : Post, p2 : Post) : Order.Order {
        Nat.compare(p2.votes, p1.votes);
      }
    );
  };

  ///////////////////////////////
  // Market Alerts (NEW)
  ///////////////////////////////

  public type Alert = {
    id : Nat;
    headline : Text;
    relatedSymbols : [Text];
    severity : { #critical; #high; #medium };
    triggeredAt : Time.Time;
    sentimentScore : Float;
  };

  let marketAlerts = Map.empty<Nat, Alert>();

  public query func getMarketAlerts() : async [Alert] {
    let alertsArray = marketAlerts.values().toArray();
    alertsArray.sort(
      func(a1 : Alert, a2 : Alert) : Order.Order {
        Int.compare(a2.triggeredAt, a1.triggeredAt);
      }
    );
  };

  //////////////////////////
  // NEW PUBLIC ENDPOINTS
  //////////////////////////

  public query ({ caller }) func getPublicNewsFeed() : async [NewsArticle] {
    newsArticles.values().toArray();
  };

  public query ({ caller }) func getPublicMarketAlerts() : async [Alert] {
    marketAlerts.values().toArray();
  };

  public type StockSymbol = Text;

  public query ({ caller }) func getPublicStockList() : async [StockSymbol] {
    [ "AAPL", "GOOGL", "AMZN", "MSFT", "TSLA" ];
  };

  public type LeaderboardEntry = {
    displayName : Text;
    accuracyRate : Float;
  };

  public query ({ caller }) func getPublicLeaderboard() : async [LeaderboardEntry] {
    userProfiles.toArray().map(
      func((_, profile)) { { displayName = profile.displayName; accuracyRate = profile.predictionAccuracy } }
    );
  };
};

