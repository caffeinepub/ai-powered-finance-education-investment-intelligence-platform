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

  public query func getNewsArticles() : async [NewsArticle] {
    newsArticles.values().toArray();
  };

  public query func getNewsArticle(id : Nat) : async ?NewsArticle {
    newsArticles.get(id);
  };

  public shared ({ caller }) func addNewsArticle(article : NewsArticle) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add news articles");
    };
    newsArticles.add(article._id, article);
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
