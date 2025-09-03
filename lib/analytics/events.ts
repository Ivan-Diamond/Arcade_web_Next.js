// Amplitude Event Catalog
// Organized by feature area for consistency and maintainability

// ===== AUTHENTICATION EVENTS =====
export const AUTH_EVENTS = {
  SIGN_UP_STARTED: '[Auth] Sign Up Started',
  SIGN_UP_COMPLETED: '[Auth] Sign Up Completed',
  LOGIN_ATTEMPTED: '[Auth] Login Attempted',
  LOGIN_SUCCESS: '[Auth] Login Success',
  LOGIN_FAILED: '[Auth] Login Failed',
  VISITOR_CREATED: '[Auth] Visitor Created',
  VISITOR_CREATION_FAILED: '[Auth] Visitor Creation Failed',
  VISITOR_UPGRADED: '[Auth] Visitor Upgraded',
  VISITOR_UPGRADE_PAGE_VIEWED: '[Auth] Visitor Upgrade Page Viewed',
  VISITOR_UPGRADE_ATTEMPTED: '[Auth] Visitor Upgrade Attempted',
  VISITOR_UPGRADE_FAILED: '[Auth] Visitor Upgrade Failed',
  LOGOUT: '[Auth] Logout',
  PASSWORD_RESET_REQUESTED: '[Auth] Password Reset Requested',
} as const;

// ===== HOMEPAGE & DISCOVERY EVENTS =====
export const HOME_EVENTS = {
  LANDING_PAGE_VIEWED: '[Home] Landing Page Viewed',
  CTA_CLICKED: '[Home] CTA Clicked',
  FEATURE_CARD_CLICKED: '[Home] Feature Card Clicked'
} as const;

// ===== LOBBY & MACHINE SELECTION EVENTS =====
export const LOBBY_EVENTS = {
  PAGE_LOADED: '[Lobby] Page Loaded',
  MACHINE_SEARCHED: '[Lobby] Machine Searched',
  MACHINE_FILTERED: '[Lobby] Machine Filtered',
  MACHINE_CARD_VIEWED: '[Lobby] Machine Card Viewed',
  MACHINE_SELECTED: '[Lobby] Machine Selected',
  MACHINE_UNAVAILABLE_CLICKED: '[Lobby] Machine Unavailable Clicked'
} as const;

// ===== GAME ROOM & GAMEPLAY EVENTS =====
export const GAME_EVENTS = {
  // Connection & Setup
  ROOM_ENTERED: '[Game] Room Entered',
  WEBRTC_CONNECTED: '[Game] WebRTC Connected',
  WEBRTC_DISCONNECTED: '[Game] WebRTC Disconnected',
  WEBRTC_FAILED: '[Game] WebRTC Failed',
  SOCKET_CONNECTED: '[Game] Socket Connected',
  
  // Queue Management
  JOINED_QUEUE: '[Game] Joined Queue',
  QUEUE_POSITION_UPDATED: '[Game] Queue Position Updated',
  LEFT_QUEUE: '[Game] Left Queue',
  
  // Core Gameplay
  START_BUTTON_CLICKED: '[Game] Start Button Clicked',
  GAME_STARTED: '[Game] Game Started',
  CONTROL_USED: '[Game] Control Used',
  CLAW_DROPPED: '[Game] Claw Dropped',
  GAME_ENDED: '[Game] Game Ended',
  GAME_COMPLETED: '[Game] Game Completed',
  PRIZE_WON: '[Game] Prize Won',
  GAME_FAILED: '[Game] Game Failed',
  
  // Camera & Controls
  CAMERA_SWITCHED: '[Game] Camera Switched',
  CONTROL_MODE_CHANGED: '[Game] Control Mode Changed',
  HOW_TO_PLAY_OPENED: '[Game] How To Play Opened'
} as const;

// ===== WAWA MESSAGES & SOCIAL EVENTS =====
export const WAWA_EVENTS = {
  MESSAGE_SENT: '[Wawa] Message Sent',
  MESSAGE_RECEIVED: '[Wawa] Message Received',
  EMOJI_SENT: '[Wawa] Emoji Sent',
  REACTION_ADDED: '[Wawa] Reaction Added'
} as const;

// ===== PROFILE & STATS EVENTS =====
export const PROFILE_EVENTS = {
  PAGE_VIEWED: '[Profile] Page Viewed',
  TAB_CHANGED: '[Profile] Tab Changed',
  NAME_CHANGE_CLICKED: '[Profile] Name Change Clicked',
  NAME_CHANGED_SUCCESS: '[Profile] Name Changed Success',
  NAME_CHANGE_FAILED: '[Profile] Name Change Failed',
  UPGRADE_ACCOUNT_CLICKED: '[Profile] Upgrade Account Clicked',
  FEEDBACK_OPENED: '[Profile] Feedback Opened',
  FEEDBACK_SUBMITTED: '[Profile] Feedback Submitted',
  HISTORY_VIEWED: '[Profile] History Viewed',
  USER_LOGGED_OUT: '[Profile] User Logged Out'
} as const;

// ===== LEADERBOARD EVENTS =====
export const LEADERBOARD_EVENTS = {
  VIEWED: '[Leaderboard] Viewed',
  TAB_SWITCHED: '[Leaderboard] Tab Switched',
  PLAYER_PROFILE_CLICKED: '[Leaderboard] Player Profile Clicked'
} as const;

// ===== ECONOMY EVENTS =====
export const ECONOMY_EVENTS = {
  COINS_SPENT: '[Economy] Coins Spent',
  COINS_EARNED: '[Economy] Coins Earned',
  INSUFFICIENT_COINS: '[Economy] Insufficient Coins',
  PURCHASE_INITIATED: '[Economy] Purchase Initiated'
} as const;

// ===== PERFORMANCE & ERROR EVENTS =====
export const PERFORMANCE_EVENTS = {
  PAGE_LOAD_TIME: '[Perf] Page Load Time',
  API_RESPONSE_TIME: '[Perf] API Response Time',
  WEBRTC_LATENCY: '[Perf] WebRTC Latency',
  VIDEO_STREAM_QUALITY: '[Perf] Video Stream Quality'
} as const;

export const ERROR_EVENTS = {
  API_FAILED: '[Error] API Failed',
  WEBRTC_CONNECTION_LOST: '[Error] WebRTC Connection Lost',
  GAME_CRASH: '[Error] Game Crash',
  PAYMENT_FAILED: '[Error] Payment Failed'
} as const;

// ===== NAVIGATION EVENTS =====
export const NAVIGATION_EVENTS = {
  PAGE_VIEWED: '[Navigation] Page Viewed',
  NAV_ITEM_CLICKED: '[Navigation] Nav Item Clicked',
  BACK_BUTTON_CLICKED: '[Navigation] Back Button Clicked',
  ROUTE_CHANGED: '[Navigation] Route Changed'
} as const;

// ===== SESSION & ENGAGEMENT EVENTS =====
export const SESSION_EVENTS = {
  APP_OPENED: '[Session] App Opened',
  APP_BACKGROUNDED: '[Session] App Backgrounded',
  DAILY_ACTIVE: '[Session] Daily Active',
  RAGE_QUIT: '[Session] Rage Quit'
} as const;

// Type exports for type safety
export type AuthEventType = typeof AUTH_EVENTS[keyof typeof AUTH_EVENTS];
export type HomeEventType = typeof HOME_EVENTS[keyof typeof HOME_EVENTS];
export type LobbyEventType = typeof LOBBY_EVENTS[keyof typeof LOBBY_EVENTS];
export type GameEventType = typeof GAME_EVENTS[keyof typeof GAME_EVENTS];
export type WawaEventType = typeof WAWA_EVENTS[keyof typeof WAWA_EVENTS];
export type ProfileEventType = typeof PROFILE_EVENTS[keyof typeof PROFILE_EVENTS];
export type LeaderboardEventType = typeof LEADERBOARD_EVENTS[keyof typeof LEADERBOARD_EVENTS];
export type EconomyEventType = typeof ECONOMY_EVENTS[keyof typeof ECONOMY_EVENTS];
export type NavigationEventType = typeof NAVIGATION_EVENTS[keyof typeof NAVIGATION_EVENTS];
export type PerformanceEventType = typeof PERFORMANCE_EVENTS[keyof typeof PERFORMANCE_EVENTS];
export type ErrorEventType = typeof ERROR_EVENTS[keyof typeof ERROR_EVENTS];
export type SessionEventType = typeof SESSION_EVENTS[keyof typeof SESSION_EVENTS];
