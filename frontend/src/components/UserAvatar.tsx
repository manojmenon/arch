import React from 'react';
import { User } from '../types';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md', 
  className = '' 
}) => {
  // Generate avatar initials
  const getAvatarInitials = (user: User): string => {
    if (user.username) {
      const nameParts = user.username.split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      } else {
        return user.username.substring(0, 2).toUpperCase();
      }
    } else if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const initials = getAvatarInitials(user);
  const sizeClass = sizeClasses[size];

  return (
    <div 
      className={`${sizeClass} ${className} rounded-full bg-primary-600 text-white flex items-center justify-center font-medium`}
      title={user.username || user.email}
    >
      {initials}
    </div>
  );
};
