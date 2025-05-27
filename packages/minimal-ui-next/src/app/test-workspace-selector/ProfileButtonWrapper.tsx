'use client';

import { User } from '@supabase/supabase-js';
import { SupabaseProfileButton } from '@/components/profile/SupabaseProfileButton';

interface ProfileButtonWrapperProps {
  user: User;
}

export function ProfileButtonWrapper({ user }: ProfileButtonWrapperProps) {
  const handleProfileClick = () => {
    console.log('Profile clicked for user:', user.email);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Profile Button</h2>
      <SupabaseProfileButton 
        user={user}
        onProfileClick={handleProfileClick}
      />
    </div>
  );
} 