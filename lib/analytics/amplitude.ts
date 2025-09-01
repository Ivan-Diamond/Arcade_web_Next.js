// Using CDN-based Amplitude instead of npm package
// Scripts loaded in layout.tsx
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
      if (typeof window !== 'undefined' && window.amplitude) {
        window.amplitude.track(eventName, properties);
        console.log(`Event tracked: ${eventName}`, properties);
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track a page view
   */
  trackPageView(pageName: string, properties?: any) {
    if (!this.initialized) return;

    try {
      if (typeof window !== 'undefined' && window.amplitude) {
        window.amplitude.track('Page View', {
          page: pageName,
          ...properties
        });
      }
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  /**
   * Track user login
   */
  trackLogin(method: 'visitor' | 'email' | 'username', userId: string, userProperties?: any) {
    this.track('User Login', {
      method,
      userId,
      ...userProperties
    });
  }

  /**
   * Track user logout
   */
  trackLogout(userId: string) {
    this.track('User Logout', { userId });
    if (typeof window !== 'undefined' && window.amplitude) {
      // Reset user but keep device ID
      window.amplitude.setUserId(null);
    }
  }

  /**
   * Track game events
   */
  trackGameStart(gameId: string, roomId: string, coinCost: number) {
    this.track('Game Start', {
      gameId,
      roomId,
      coinCost,
      timestamp: new Date().toISOString()
    });
  }

  trackGameEnd(gameId: string, result: 'win' | 'lose' | 'timeout', coinsWon: number, duration: number) {
    this.track('Game End', {
      gameId,
      result,
      coinsWon,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track visitor account events
   */
  trackVisitorCreated(visitorId: string) {
    this.track('Visitor Account Created', {
      visitorId,
      timestamp: new Date().toISOString()
    });
  }

  trackVisitorUpgrade(visitorId: string, newUserId: string) {
    this.track('Visitor Account Upgraded', {
      visitorId,
      newUserId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track coin transactions
   */
  trackCoinTransaction(type: 'earned' | 'spent', amount: number, reason: string) {
    this.track('Coin Transaction', {
      type,
      amount,
      reason,
      timestamp: new Date().toISOString()
    });
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
}

// Export singleton instance
export const amplitudeService = new AmplitudeService();

// CDN-based Amplitude is available globally as window.amplitude
