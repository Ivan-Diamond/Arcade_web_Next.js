'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gamepad2, Trophy, Users, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { amplitudeService } from '@/lib/analytics/amplitude';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isCreatingVisitor, setIsCreatingVisitor] = useState(false);
  const [hasAttemptedVisitor, setHasAttemptedVisitor] = useState(false);

  // Track homepage view on mount
  useEffect(() => {
    amplitudeService.trackHomeEvent('LANDING_PAGE_VIEWED', {
      source: 'direct'
    });
  }, []);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // If user is already authenticated, redirect to lobby immediately
      if (status === 'authenticated' && session) {
        router.push('/lobby');
        return;
      }

      // If unauthenticated and haven't attempted visitor creation yet
      if (status === 'unauthenticated' && !hasAttemptedVisitor && !isCreatingVisitor) {
        // Check if user has opted out of auto-visitor (stored in localStorage)
        const hasOptedOut = localStorage.getItem('optOutAutoVisitor') === 'true';
        
        if (!hasOptedOut) {
          await createVisitorAccount();
        }
      }
    };

    if (status !== 'loading') {
      checkAuthAndRedirect();
    }
  }, [status, session, hasAttemptedVisitor, isCreatingVisitor]);

  const createVisitorAccount = async () => {
    setIsCreatingVisitor(true);
    setHasAttemptedVisitor(true);

    try {
      // Call backend API directly since production API routes have issues
      const response = await fetch('https://msaarcade.com/game/uaa/v1/createNewVisitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.code === 20000 && data.data?.username && data.data?.password) {
        // Use NextAuth signIn with the visitor credentials
        const result = await signIn('credentials', {
          username: data.data.username,
          password: data.data.password,
          redirect: false,
        });

        if (result?.ok) {
          // Track successful visitor creation
          amplitudeService.trackAuthEvent('VISITOR_CREATED', {
            source: 'homepage',
            auto: !hasAttemptedVisitor
          });
          
          toast.success('Welcome! You\'re playing as a guest.');
          router.push('/lobby');
        } else {
          console.error('Failed to sign in with visitor account');
          
          // Track visitor creation failure
          amplitudeService.trackAuthEvent('VISITOR_CREATION_FAILED', {
            source: 'homepage',
            error_type: 'signin_failed'
          });
          
          toast.error('Failed to create guest session. Please try logging in.');
        }
      } else {
        console.error('Failed to create visitor account:', data);
        // Track API failure
        amplitudeService.trackAuthEvent('VISITOR_CREATION_FAILED', {
          source: 'homepage',
          error_type: 'api_error'
        });
        // Don't show error toast - just show the welcome page
      }
    } catch (error) {
      console.error('Error creating visitor account:', error);
      // Track exception
      amplitudeService.trackAuthEvent('VISITOR_CREATION_FAILED', {
        source: 'homepage',
        error_type: 'exception'
      });
      // Don't show error toast - just show the welcome page
    } finally {
      setIsCreatingVisitor(false);
    }
  };

  const handlePlayAsGuest = async () => {
    // Track play as guest click
    amplitudeService.trackHomeEvent('CTA_CLICKED', {
      cta_type: 'play_as_guest',
      location: 'hero'
    });
    
    localStorage.removeItem('optOutAutoVisitor');
    await createVisitorAccount();
  };

  const handleLoginClick = () => {
    // Track login button click
    amplitudeService.trackHomeEvent('CTA_CLICKED', {
      cta_type: 'login',
      location: 'hero'
    });
    
    // User explicitly wants to login, so opt them out of auto-visitor for this session
    localStorage.setItem('optOutAutoVisitor', 'true');
    router.push('/login');
  };

  const handleRegisterClick = () => {
    // Track register button click
    amplitudeService.trackHomeEvent('CTA_CLICKED', {
      cta_type: 'register',
      location: 'hero'
    });
    
    // User explicitly wants to register, so opt them out of auto-visitor for this session
    localStorage.setItem('optOutAutoVisitor', 'true');
    router.push('/register');
  };

  // Show loading state while checking auth or creating visitor
  if (status === 'loading' || (status === 'unauthenticated' && isCreatingVisitor)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">
            {isCreatingVisitor ? 'Setting up your game session...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Show welcome page only if not authenticated and not creating visitor
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-neon-purple rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-cyan rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-neon-pink rounded-full opacity-20 blur-3xl animate-pulse" />
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
          className="mb-8"
        >
          <h1 className="text-7xl md:text-8xl font-bold font-cyber mb-4">
            <span className="gradient-text">MSA</span>
            <span className="text-white ml-4">ARCADE</span>
          </h1>
          <p className="text-xl text-neon-cyan animate-pulse">Online Claw Machine Experience</p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto"
        >
          <FeatureCard
            icon={<Gamepad2 className="w-8 h-8" />}
            title="Real Machines"
            description="Play with actual claw machines via live streaming"
            color="cyan"
          />
          <FeatureCard
            icon={<Trophy className="w-8 h-8" />}
            title="Win Coins"
            description="Earn virtual coins with every successful grab"
            color="purple"
          />
          <FeatureCard
            icon={<Users className="w-8 h-8" />}
            title="Compete"
            description="Climb the leaderboard and become a champion"
            color="pink"
          />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            onClick={handlePlayAsGuest}
            disabled={isCreatingVisitor}
          >
            {isCreatingVisitor ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Gamepad2 className="mr-2 h-5 w-5" />
                Play as Guest
              </>
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-white/20 bg-white/10 hover:bg-white/20 text-white px-8 py-6 text-lg rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
            onClick={handleLoginClick}
          >
            Login
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-white/20 bg-white/10 hover:bg-white/20 text-white px-8 py-6 text-lg rounded-full backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
            onClick={handleRegisterClick}
          >
            Sign Up
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 grid grid-cols-3 gap-8 text-center"
        >
          <StatItem value="10K+" label="Players" />
          <StatItem value="50+" label="Machines" />
          <StatItem value="24/7" label="Available" />
        </motion.div>
      </motion.div>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  color 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  color: 'cyan' | 'purple' | 'pink'
}) {
  const colorClasses = {
    cyan: 'text-neon-cyan border-neon-cyan hover:shadow-neon-cyan',
    purple: 'text-neon-purple border-neon-purple hover:shadow-neon-purple',
    pink: 'text-neon-pink border-neon-pink hover:shadow-neon-pink',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`card-neon border-2 ${colorClasses[color]} transition-all duration-300 hover:bg-opacity-10`}
    >
      <div className={`mb-4 ${colorClasses[color]}`}>{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </motion.div>
  )
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold gradient-text">{value}</div>
      <div className="text-gray-400 text-sm mt-1">{label}</div>
    </div>
  )
}
