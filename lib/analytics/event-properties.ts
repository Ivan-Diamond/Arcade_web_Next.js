// Typed Event Properties for Amplitude Events
// Ensures consistency and type safety across all event tracking

// ===== AUTHENTICATION PROPERTIES =====
export interface AuthEventProperties {
  method?: 'email' | 'visitor' | 'credentials' | 'social';
  source?: 'homepage' | 'modal' | 'navbar' | 'game';
  user_id?: string;
  user_type?: 'visitor' | 'registered';
  time_to_complete?: number;
  session_duration?: number;
  error_type?: string;
  auto?: boolean;
  coins_transferred?: number;
  coins_balance?: number;
}

// ===== HOMEPAGE PROPERTIES =====
export interface HomeEventProperties {
  source?: 'direct' | 'social' | 'search' | 'referral';
  cta_type?: 'play_as_guest' | 'login' | 'register' | 'learn_more';
  location?: 'hero' | 'features' | 'testimonials' | 'pricing' | 'footer';
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  button?: 'play_guest' | 'login' | 'signup';
  feature?: 'real_machines' | 'win_coins' | 'compete';
}

// ===== LOBBY PROPERTIES =====
export interface LobbyEventProperties {
  available_machines?: number;
  user_coins?: number;
  query?: string;
  results_count?: number;
  filter_type?: string;
  filter_value?: string;
  machine_id?: string;
  machine_name?: string;
  machine_type?: string;
  price?: number;
  status?: 'online' | 'offline';
  queue_size?: number;
  reason?: string;
}

// ===== GAME PROPERTIES =====
export interface GameEventProperties {
  machine_id?: string;
  machine_name?: string;
  machine_type?: string;
  room_id?: string;
  source?: 'lobby' | 'direct' | 'queue' | 'retry';
  result?: 'win' | 'loss' | 'timeout' | 'error';
  win_amount?: number;
  play_duration?: number;
  control_action?: 'up' | 'down' | 'left' | 'right' | 'grab';
  control_type?: 'joystick' | 'button' | 'touch';
  queue_position?: number;
  queue_size?: number;
  camera_view?: 0 | 1;
  control_mode?: 'normal' | 'fine';
  error_reason?: string;
  price?: number;
  latency?: number;
  estimated_wait?: number;
  wait_time?: number;
  coins_cost?: number;
  game_duration?: number;
  position_x?: number;
  position_y?: number;
  timing?: number;
  duration?: number;
  moves_count?: number;
  coins_won?: number;
  prize_type?: string;
  reason?: string;
  from_camera?: number;
  user_coins_before?: number;
  user_coins_after?: number;
  to_camera?: number;
  mode?: 'joystick' | 'buttons';
}

// ===== WAWA MESSAGE PROPERTIES =====
export interface WawaEventProperties {
  message_type?: string;
  recipient_count?: number;
  room_id?: string;
  sender_id?: string;
  emoji_type?: string;
  target_player?: string;
  reaction_type?: string;
  message_id?: string;
  is_heartmessage?: boolean; // To filter out heart messages
}

// ===== PROFILE PROPERTIES =====
export interface ProfileEventProperties {
  user_id?: string;
  user_level?: number;
  user_coins?: number;
  total_wins?: number;
  total_games?: number;
  level?: number;
  coins?: number;
  wins?: number;
  from_tab?: string;
  to_tab?: string;
  feedback_type?: string;
  rating?: number;
  games_count?: number;
  time_range?: string;
  source?: string;
  old_username?: string;
  new_username?: string;
  error?: string;
}

// ===== LEADERBOARD PROPERTIES =====
export interface LeaderboardEventProperties {
  tab?: 'wins' | 'coins';
  user_rank?: number;
  from?: 'wins' | 'coins';
  to?: 'wins' | 'coins';
  target_user_id?: string;
  rank?: number;
}

// ===== NAVIGATION PROPERTIES =====
export interface NavigationEventProperties {
  page_path?: string;
  page_name?: string;
  from_page?: string;
  to_page?: string;
  nav_item?: string;
  source?: string;
  user_id?: string;
  user_role?: string;
}

// ===== ECONOMY PROPERTIES =====
export interface EconomyEventProperties {
  amount?: number;
  purpose?: 'game' | 'powerup' | 'upgrade';
  balance_before?: number;
  balance_after?: number;
  source?: 'win' | 'daily' | 'achievement' | 'purchase';
  required?: number;
  current?: number;
  action_blocked?: string;
  package?: string;
  price?: number;
}

// ===== PERFORMANCE PROPERTIES =====
export interface PerformanceEventProperties {
  page?: string;
  duration_ms?: number;
  connection_type?: string;
  endpoint?: string;
  status_code?: number;
  latency_ms?: number;
  packet_loss?: number;
  jitter?: number;
  resolution?: string;
  fps?: number;
  bitrate?: number;
}

// ===== ERROR PROPERTIES =====
export interface ErrorEventProperties {
  endpoint?: string;
  error_code?: string;
  error_message?: string;
  retry_count?: number;
  duration_before_fail?: number;
  error_type?: string;
  machine_id?: string;
  user_action?: string;
  amount?: number;
}

// ===== SESSION PROPERTIES =====
export interface SessionEventProperties {
  source?: string;
  previous_session_duration?: number;
  duration?: number;
  page?: string;
  consecutive_days?: number;
  total_sessions?: number;
  last_action?: string;
  frustration_indicators?: string[];
}

// ===== COMMON PROPERTIES =====
// These properties are automatically added to all events
export interface CommonEventProperties {
  timestamp?: string;
  session_id?: string;
  user_id?: string;
  device_id?: string;
  page_url?: string;
  platform?: 'web' | 'mobile' | 'tablet';
  user_coins?: number;
  user_type?: 'visitor' | 'registered';
}
