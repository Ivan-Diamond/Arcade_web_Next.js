'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Info, Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { useSession, getSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { amplitudeService } from '@/lib/analytics/amplitude';
import { profileService } from '@/lib/api/services/profileService';

export default function UpgradeAccountPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const { user: authUser, updateUserAndToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);
  const [currentUsername, setCurrentUsername] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Check authentication and get current username
  useEffect(() => {
    const verifyAuthAndSetup = async () => {
      setIsVerifyingAuth(true);
      
      // Get current session and username
      const currentSession = await getSession();
      if (!currentSession?.user) {
        toast.error('You must be logged in to upgrade your account');
        router.push('/login');
        return;
      }

      // Check if user is a visitor account from session
      if (!currentSession.user.isVisitor) {
        toast.error('This page is only for guest account upgrades');
        router.push('/profile');
        return;
      }

      const username = authUser?.username || currentSession.user?.username || currentSession.user?.name || '';
      setCurrentUsername(username);
      setFormData(prev => ({ ...prev, username }));
      
      // Track page view
      amplitudeService.trackAuthEvent('VISITOR_UPGRADE_PAGE_VIEWED', {});
      
      setIsVerifyingAuth(false);
    };

    verifyAuthAndSetup();
  }, [router, authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    // Email validation if provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address');
        return;
      }
    }

    setIsLoading(true);

    try {
      // Track upgrade attempt
      amplitudeService.trackAuthEvent('VISITOR_UPGRADE_ATTEMPTED', {});

      const response = await profileService.upgradeAccount({
        newUsername: formData.username.trim(),
        newPassword: formData.password,
        newEmail: formData.email.trim() || undefined,
      });

      if (response.success && response.data) {
        toast.success('Account upgraded successfully!');
        
        // Track successful upgrade
        amplitudeService.trackAuthEvent('VISITOR_UPGRADED', {});

        // Update NextAuth session first
        await update({
          username: response.data.username,
          jwt: response.data.jwt
        });

        // Then sync auth store with fresh session data (including correct balance)
        const { syncWithSession } = useAuthStore.getState();
        await syncWithSession();

        // Visitor flags are now handled by session data

        // Redirect to profile page
        setTimeout(() => {
          router.push('/profile');
          window.location.reload(); // Ensure full page reload to update session everywhere
        }, 1000);
      } else {
        // Track failed upgrade
        amplitudeService.trackAuthEvent('VISITOR_UPGRADE_FAILED', {});
        
        toast.error(response.error || 'Failed to upgrade account');
      }
    } catch (error: any) {
      console.error('Error upgrading account:', error);
      toast.error('Failed to upgrade account');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-neon-purple rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-neon-cyan rounded-full opacity-20 blur-3xl animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="card-neon backdrop-blur-neon">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block mb-4"
            >
              <Shield className="w-16 h-16 text-neon-purple mx-auto" />
            </motion.div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Upgrade Your Account
            </h1>
            <p className="text-center text-gray-400 mb-8">
              Convert your guest account to save progress and unlock all features!
            </p>
            
            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-semibold mb-1">Upgrading Guest Account: {currentUsername}</p>
                  <p className="text-blue-300/80">
                    Your progress, coins, and game history will be preserved after upgrade!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Username
              </label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-purple" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-neon pl-10"
                  placeholder="Choose your new username"
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">3-20 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-purple" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-neon pl-10"
                  placeholder="your.email@example.com"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Optional - for account recovery</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-purple" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-neon pl-10"
                  placeholder="Enter a secure password"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neon-purple" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-neon pl-10"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-neon btn-neon-purple flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Upgrade Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Changed your mind?{' '}
              <Link href="/profile" className="text-neon-cyan hover:text-neon-green transition-colors">
                Back to Profile
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
