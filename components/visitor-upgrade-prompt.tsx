'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VisitorUpgradePrompt() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissedForSession, setDismissedForSession] = useState(false);

  useEffect(() => {
    // Check if user is a visitor and hasn't dismissed the prompt this session
    if (session?.user?.isVisitor && !dismissedForSession) {
      // Show prompt after a delay to not be too intrusive
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // Show after 30 seconds

      return () => clearTimeout(timer);
    }
  }, [session, dismissedForSession]);

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissedForSession(true);
  };

  const handleUpgrade = () => {
    // Store current visitor username for account linking
    const visitorUsername = localStorage.getItem('visitorUsername');
    if (visitorUsername) {
      localStorage.setItem('upgradingFromVisitor', visitorUsername);
    }
    router.push('/register');
  };

  if (!session?.user?.isVisitor || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-full z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg shadow-2xl p-6 border border-purple-500/20">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2">
              Playing as Guest
            </h3>
            <p className="text-white/80 text-sm mb-4">
              You're currently playing as a guest. Create a free account to:
            </p>
            <ul className="text-white/70 text-sm space-y-1 mb-4">
              <li className="flex items-center">
                <Gift className="h-3 w-3 mr-2 text-green-400" />
                Save your progress and coins
              </li>
              <li className="flex items-center">
                <Gift className="h-3 w-3 mr-2 text-green-400" />
                Unlock exclusive rewards
              </li>
              <li className="flex items-center">
                <Gift className="h-3 w-3 mr-2 text-green-400" />
                Access premium features
              </li>
              <li className="flex items-center">
                <Gift className="h-3 w-3 mr-2 text-green-400" />
                Join tournaments
              </li>
            </ul>
            <div className="flex space-x-2">
              <Button
                onClick={handleUpgrade}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Upgrade Account
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component to show visitor status in the UI
export function VisitorStatusBadge() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user?.isVisitor) {
    return null;
  }

  return (
    <button
      onClick={() => router.push('/register')}
      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors cursor-pointer"
    >
      <AlertCircle className="h-3 w-3 mr-1" />
      Guest Account - Click to Upgrade
    </button>
  );
}
