'use client';

import { User, Coins } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface UserInfoProps {
  user: any;
}

export function UserInfo({ user }: UserInfoProps) {
  const router = useRouter();
  // Get username from various possible fields
  const displayName = user?.username || user?.name || 'Guest';
  const isVisitor = user?.isVisitor;
  
  const handleAvatarClick = () => {
    router.push('/avatars');
  };

  const getAvatarImagePath = (avatarName: string) => {
    return `/app/images/avatars/${avatarName}_hello.webp`;
  };
  
  return (
    <div className="p-6 border-b border-dark-border bg-gradient-to-br from-dark-card to-dark-hover">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button
            onClick={handleAvatarClick}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer p-1"
          >
            <div className="w-full h-full rounded-full bg-dark-card flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <Image
                  src={getAvatarImagePath(user.avatar)}
                  alt={user.avatar}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="h-7 w-7 text-white" />
              )}
            </div>
          </button>
          {isVisitor && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full border-2 border-dark-card flex items-center justify-center">
              <span className="text-xs text-white font-bold">G</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-white font-semibold text-lg truncate">{displayName}</p>
            {isVisitor && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                Guest
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1 mt-1">
            <Coins className="h-4 w-4 text-yellow-400" />
            <p className="text-yellow-400 font-medium">{user?.coins ?? 0}</p>
            <span className="text-dark-muted text-sm">coins</span>
          </div>
        </div>
      </div>
    </div>
  );
}
