// Using CDN-based Amplitude instead of npm package
// Scripts loaded in layout.tsx
import {
  AUTH_EVENTS,
  HOME_EVENTS,
  LOBBY_EVENTS,
  GAME_EVENTS,
  WAWA_EVENTS,
  PROFILE_EVENTS,
  LEADERBOARD_EVENTS,
  ECONOMY_EVENTS,
  NAVIGATION_EVENTS,
  PERFORMANCE_EVENTS,
  ERROR_EVENTS,
  SESSION_EVENTS
} from './events';

import type {
  AuthEventProperties,
  HomeEventProperties,
  LobbyEventProperties,
  GameEventProperties,
  WawaEventProperties,
  ProfileEventProperties,
  LeaderboardEventProperties,
  EconomyEventProperties,
  NavigationEventProperties,
  PerformanceEventProperties,
  ErrorEventProperties,
  SessionEventProperties,
  CommonEventProperties
} from './event-properties';

declare global {
  interface Window {
    amplitude: any;
    sessionReplay: any;
    amplitudeReady: boolean;
  }
};

interface AmplitudeUser {
  id: string;
  username?: string;
  email?: string;
  userType?: 'visitor' | 'registered';
  coins?: number;
  level?: number;
  gamesPlayed?: number;
  wins?: number;
}

class AmplitudeService {
  private initialized = false;
  private initAttempts = 0;
  private maxInitAttempts = 50; // 5 seconds max wait

  /**
   * Initialize Amplitude (CDN version is already initialized in layout.tsx)
   */
  async init() {
    if (this.initialized) {
      return;
    }

    // Wait for CDN amplitude to be available and ready
    if (typeof window !== 'undefined' && window.amplitudeReady && window.amplitude && window.amplitude.track) {
      this.initialized = true;
      console.log('Amplitude service ready');
    } else if (this.initAttempts < this.maxInitAttempts) {
      this.initAttempts++;
      // Retry after a short delay if CDN not loaded yet
      setTimeout(() => this.init(), 100);
    } else {
      console.error('Failed to initialize Amplitude after maximum attempts');
    }
  }

  /**
   * Identify a user in Amplitude
   */
  identify(user: AmplitudeUser) {
    if (!this.initialized) {
      console.warn('Amplitude not initialized, retrying...');
      setTimeout(() => this.identify(user), 500);
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.amplitude) {
        // For authenticated users
        if (user.id || user.username || user.email) {
          const userId = String(user.id || user.username || user.email).trim();
          
          // Amplitude requires user IDs to be at least 5 characters and not too long
          // Validate and format the user ID
          let validUserId: string | null = null;
          
          if (userId && userId.length > 0) {
            if (userId.length < 5) {
              // Pad short IDs
              validUserId = `user_${userId.padEnd(5, '0')}`;
            } else if (userId.length > 1024) {
              // Truncate very long IDs
              validUserId = userId.substring(0, 1024);
            } else {
              validUserId = userId;
            }
          }
          
          if (validUserId) {
            // Set the user ID
            window.amplitude.setUserId(validUserId);
            
            // Set user properties using Identify API
            const identify = new window.amplitude.Identify();
            identify.set('username', user.username || 'unknown');
            identify.set('email', user.email || 'unknown');
            identify.set('user_type', user.userType || 'registered');
            identify.set('coins', user.coins || 0);
            identify.set('level', user.level || 1);
            identify.set('games_played', user.gamesPlayed || 0);
            identify.set('wins', user.wins || 0);
            
            window.amplitude.identify(identify);
            
            // Track session started
            window.amplitude.track('[Amplitude] User Session Started', {
              user_id: validUserId,
              original_id: userId
            });
            
            console.log('User identified:', validUserId);
          } else {
            // Fallback to anonymous if we can't create a valid ID
            console.warn('Invalid user ID, using anonymous session');
            window.amplitude.track('[Amplitude] Anonymous Session Started', {
              attempted_id: userId
            });
          }
        } else {
          // For anonymous/visitor users: don't set user ID, use device ID only
          window.amplitude.track('[Amplitude] Anonymous Session Started');
          console.log('Anonymous session started');
        }
      }
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  /**
   * Track an event with optional properties
   */
  track(eventName: string, properties?: any) {
    if (!this.initialized) return;
    
    try {
      if (typeof window !== 'undefined' && window.amplitude && window.amplitude.track) {
        const eventProperties = {
          ...this.getCommonProperties(),
          ...properties
        };
        window.amplitude.track(eventName, eventProperties);
        console.log('Event tracked:', eventName, eventProperties);
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Get common properties for all events
   */
  private getCommonProperties(): CommonEventProperties {
    if (typeof window === 'undefined') return {};
    
    return {
      timestamp: new Date().toISOString(),
      page_url: window.location.pathname,
      platform: this.getPlatform()
      // user_type should be passed explicitly by calling code based on session data
    };
  }

  private getPlatform(): 'web' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined') return 'web';
    
    const userAgent = navigator.userAgent;
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
    return 'web';
  }



  /**
   * Update user properties
   */
  updateUserProperties(properties: Partial<AmplitudeUser>) {
    if (!this.initialized) {
      console.warn('Amplitude not initialized');
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.amplitude && window.amplitude.Identify) {
        const identify = new window.amplitude.Identify();
        
        // Map properties to Amplitude format
        if (properties.coins !== undefined) identify.set('coins', properties.coins);
        if (properties.level !== undefined) identify.set('level', properties.level);
        if (properties.gamesPlayed !== undefined) identify.set('games_played', properties.gamesPlayed);
        if (properties.wins !== undefined) identify.set('wins', properties.wins);
        if (properties.username) identify.set('username', properties.username);
        if (properties.email) identify.set('email', properties.email);
        
        window.amplitude.identify(identify);
        console.log('User properties updated:', properties);
      }
    } catch (error) {
      console.error('Failed to update user properties:', error);
    }
  }

  /**
   * Set user group (for organization tracking if needed)
   */
  setUserGroup(groupType: string, groupName: string) {
    if (!this.initialized) return;

    try {
      if (typeof window !== 'undefined' && window.amplitude) {
        window.amplitude.setGroup(groupType, groupName);
      }
    } catch (error) {
      console.error('Failed to set user group:', error);
    }
  }

  /**
   * Track revenue event (for future monetization)
   */
  trackRevenue(amount: number, productId: string, quantity: number = 1) {
    if (!this.initialized) return;

    try {
      // Revenue tracking with CDN amplitude
      if (typeof window !== 'undefined' && window.amplitude) {
        window.amplitude.track('Revenue', {
          product_id: productId,
          price: amount,
          quantity: quantity,
          revenue: amount * quantity,
          revenue_type: 'in_app_purchase'
        });
      }
    } catch (error) {
      console.error('Failed to track revenue:', error);
    }
  }

  /**
   * Logout user from Amplitude
   */
  logout() {
    try {
      if (typeof window !== 'undefined' && window.amplitude) {
        // Track logout event before resetting
        const sessionDuration = this.getSessionDuration();
        this.trackAuthEvent('LOGOUT', {
          session_duration: sessionDuration
        });
        
        // Reset the user ID to clear the session
        window.amplitude.reset();
        console.log('User logged out from Amplitude');
      }
    } catch (error) {
      console.error('Failed to logout from Amplitude:', error);
    }
  }

  private getSessionDuration(): number {
    // Calculate session duration if we have a session start time
    const sessionStart = sessionStorage.getItem('amplitude_session_start');
    if (sessionStart) {
      return Date.now() - parseInt(sessionStart);
    }
    return 0;
  }

  // ===== AUTHENTICATION EVENT TRACKING =====
  trackAuthEvent(event: keyof typeof AUTH_EVENTS, properties?: AuthEventProperties) {
    this.track(AUTH_EVENTS[event], properties);
  }

  // ===== HOMEPAGE EVENT TRACKING =====
  trackHomeEvent(event: keyof typeof HOME_EVENTS, properties?: HomeEventProperties) {
    this.track(HOME_EVENTS[event], properties);
  }

  // ===== LOBBY EVENT TRACKING =====
  trackLobbyEvent(event: keyof typeof LOBBY_EVENTS, properties?: LobbyEventProperties) {
    this.track(LOBBY_EVENTS[event], properties);
  }

  // ===== GAME EVENT TRACKING =====
  trackGameEvent(event: keyof typeof GAME_EVENTS, properties?: GameEventProperties) {
    this.track(GAME_EVENTS[event], properties);
  }

  // ===== WAWA MESSAGE EVENT TRACKING =====
  trackWawaEvent(event: keyof typeof WAWA_EVENTS, properties?: WawaEventProperties) {
    // Filter out HEARTMESSAGE events as they happen too frequently
    if (properties?.message_type?.toUpperCase() === 'HEARTMESSAGE' || 
        properties?.is_heartmessage) {
      return; // Don't track heart messages
    }
    this.track(WAWA_EVENTS[event], properties);
  }

  // ===== PROFILE EVENT TRACKING =====
  trackProfileEvent(event: keyof typeof PROFILE_EVENTS, properties?: ProfileEventProperties) {
    this.track(PROFILE_EVENTS[event], properties);
  }

  // ===== LEADERBOARD EVENT TRACKING =====
  trackLeaderboardEvent(event: keyof typeof LEADERBOARD_EVENTS, properties?: LeaderboardEventProperties) {
    this.track(LEADERBOARD_EVENTS[event], properties);
  }

  // ===== ECONOMY EVENT TRACKING =====
  trackEconomyEvent(event: keyof typeof ECONOMY_EVENTS, properties?: EconomyEventProperties) {
    this.track(ECONOMY_EVENTS[event], properties);
  }

  // ===== NAVIGATION EVENT TRACKING =====
  trackNavigationEvent(event: keyof typeof NAVIGATION_EVENTS, properties?: NavigationEventProperties) {
    this.track(NAVIGATION_EVENTS[event], properties);
  }

  // ===== PERFORMANCE EVENT TRACKING =====
  trackPerformanceEvent(event: keyof typeof PERFORMANCE_EVENTS, properties?: PerformanceEventProperties) {
    this.track(PERFORMANCE_EVENTS[event], properties);
  }

  // ===== ERROR EVENT TRACKING =====
  trackErrorEvent(event: keyof typeof ERROR_EVENTS, properties?: ErrorEventProperties) {
    this.track(ERROR_EVENTS[event], properties);
  }

  // ===== SESSION EVENT TRACKING =====
  trackSessionEvent(event: keyof typeof SESSION_EVENTS, properties?: SessionEventProperties) {
    this.track(SESSION_EVENTS[event], properties);
  }

  // ===== CONVENIENCE METHODS FOR COMMON EVENTS =====
  
  trackGameStart(machineId: string, machineName: string, coinsCost: number, userCoins: number) {
    this.trackGameEvent('GAME_STARTED', {
      machine_id: machineId,
      machine_name: machineName,
      coins_cost: coinsCost,
      user_coins_before: userCoins
    });
    
    // Also track economy event
    this.trackEconomyEvent('COINS_SPENT', {
      amount: coinsCost,
      purpose: 'game',
      balance_before: userCoins,
      balance_after: userCoins - coinsCost
    });
  }

  trackGameWin(machineId: string, coinsWon: number, userCoins: number) {
    this.trackGameEvent('PRIZE_WON', {
      machine_id: machineId,
      coins_won: coinsWon,
      user_coins_after: userCoins + coinsWon
    });
    
    // Also track economy event
    this.trackEconomyEvent('COINS_EARNED', {
      amount: coinsWon,
      source: 'win',
      balance_before: userCoins,
      balance_after: userCoins + coinsWon
    });
  }

  trackPageView(pageName: string, properties?: any) {
    // Amplitude's default page view tracking may handle this
    // But we can track specific page views with custom properties
    this.track(`[Navigation] ${pageName} Viewed`, {
      page: pageName,
      ...properties
    });
  }
}

export const amplitudeService = new AmplitudeService();

// CDN-based Amplitude is available globally as window.amplitude
