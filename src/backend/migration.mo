import BaseToCore "BaseToCore";
import Map "mo:core/Map";
import OrderedMap "mo:base/OrderedMap";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Text "mo:core/Text";

module {
  // ── Shared types (duplicated from main.mo — cannot import main.mo) ─────────

  type UserProfile = {
    name : Text;
  };

  type BlogPost = {
    id : Nat;
    title : Text;
    content : Text;
    timestamp : Time.Time;
    author : Principal;
  };

  type WebLink = {
    id : Nat;
    title : Text;
    url : Text;
    description : Text;
  };

  type CaffeineInfo = {
    content : Text;
    lastUpdated : Time.Time;
  };

  type CaffeineInfoScreenRecord = {
    id : Text;
    title : Text;
    content : Text;
    order : Nat;
    mediaUrl : ?Text;
  };

  type HeadingConfig = {
    text : Text;
    font : Text;
    color : Text;
    backgroundColor : ?Text;
    backgroundImageUrl : ?Text;
  };

  type BackgroundConfig = {
    pageBackgroundColor : ?Text;
    pageBackgroundImageUrl : ?Text;
    aboutCardColor : ?Text;
    aboutCardImageUrl : ?Text;
    blogCardColor : ?Text;
    blogCardImageUrl : ?Text;
    linksCardColor : ?Text;
    linksCardImageUrl : ?Text;
  };

  // ── Old actor state (using mo:base OrderedMap) ─────────────────────────────

  public type OldActor = {
    // Access control
    accessControlState : BaseToCore.OldAccessControlState;

    // User profiles
    userProfiles : OrderedMap.Map<Principal, UserProfile>;

    // Blog posts
    blogPosts : OrderedMap.Map<Nat, BlogPost>;
    var nextBlogPostId : Nat;

    // Web links
    var webLinks : OrderedMap.Map<Nat, WebLink>;
    var nextWebLinkId : Nat;
    var webLinksOrder : [Nat];

    // Caffeine info
    var caffeineInfo : ?CaffeineInfo;

    // CaffeineInfo screens
    caffeineInfoScreens : OrderedMap.Map<Text, CaffeineInfoScreenRecord>;
    var caffeineInfoSectionTitle : Text;

    // Visit counter
    var visitCount : Nat;

    // Heading / background config
    var headingConfig : HeadingConfig;
    var backgroundConfig : BackgroundConfig;
  };

  // ── New actor state (using mo:core Map) ────────────────────────────────────

  public type NewActor = {
    // Access control
    accessControlState : BaseToCore.NewAccessControlState;

    // User profiles
    userProfiles : Map.Map<Principal, UserProfile>;

    // Blog posts
    blogPosts : Map.Map<Nat, BlogPost>;
    var nextBlogPostId : Nat;

    // Web links
    var webLinks : Map.Map<Nat, WebLink>;
    var nextWebLinkId : Nat;
    var webLinksOrder : [Nat];

    // Caffeine info
    var caffeineInfo : ?CaffeineInfo;

    // CaffeineInfo screens
    caffeineInfoScreens : Map.Map<Text, CaffeineInfoScreenRecord>;
    var caffeineInfoSectionTitle : Text;

    // Visit counter
    var visitCount : Nat;

    // Heading / background config
    var headingConfig : HeadingConfig;
    var backgroundConfig : BackgroundConfig;
  };

  // ── Migration function ─────────────────────────────────────────────────────

  public func run(old : OldActor) : NewActor {
    {
      accessControlState = BaseToCore.migrateAccessControlState(old.accessControlState);
      userProfiles = BaseToCore.migrateOrderedMap<Principal, UserProfile>(old.userProfiles, Principal.compare);
      blogPosts = BaseToCore.migrateOrderedMap<Nat, BlogPost>(old.blogPosts, Nat.compare);
      var nextBlogPostId = old.nextBlogPostId;
      var webLinks = BaseToCore.migrateOrderedMap<Nat, WebLink>(old.webLinks, Nat.compare);
      var nextWebLinkId = old.nextWebLinkId;
      var webLinksOrder = old.webLinksOrder;
      var caffeineInfo = old.caffeineInfo;
      caffeineInfoScreens = BaseToCore.migrateOrderedMap<Text, CaffeineInfoScreenRecord>(old.caffeineInfoScreens, Text.compare);
      var caffeineInfoSectionTitle = old.caffeineInfoSectionTitle;
      var visitCount = old.visitCount;
      var headingConfig = old.headingConfig;
      var backgroundConfig = old.backgroundConfig;
    };
  };
};
