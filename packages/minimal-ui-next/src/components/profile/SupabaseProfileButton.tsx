import { User } from '@supabase/supabase-js';

interface SupabaseProfileButtonProps {
  user: User;
  onProfileClick?: () => void;
}

export function SupabaseProfileButton({ user, onProfileClick }: SupabaseProfileButtonProps) {
  const userInitial = user.email?.[0].toUpperCase() || 'U';

  return (
    <button
      onClick={onProfileClick}
      className="justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 flex-1 text-left flex items-center gap-2 py-2"
    >
      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
        {userInitial}
      </div>
      <div className="flex flex-1 flex-col gap-0 whitespace-nowrap transition-all duration-300 ease-in-out w-auto opacity-100">
        <span className="text-sm font-medium">{user.email}</span>
        <span className="text-xs text-muted-foreground">View profile</span>
      </div>
    </button>
  );
} 