'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home,
  CreditCard,
  PiggyBank,
  Calendar,
  LineChart,
  BarChart4,
  FileText,
  Cog,
  HelpCircle,
  MoreVertical,
  LogOut,
  Plus,
  Check,
  Download,
  ChevronsUpDown,
  Settings,
  Filter,
  Search
} from 'lucide-react';
import { useWorkspace } from '@/context/workspace-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from 'sonner';
import { SearchDialog } from '@/components/search/search-dialog';

interface NavGroup {
  title: string;
  items: SidebarNavItem[];
}

interface SidebarNavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  indented?: boolean;
  isSearchButton?: boolean;
}

interface Workspace {
  id: string;
  name: string;
  lastOpened: string;
  createdAt: string;
  size: string;
  path: string;
}

// Organized navigation structure with groups
const sidebarNavGroups: NavGroup[] = [
  {
    title: "",  // Empty title for Core Navigation
    items: [
      {
        title: 'Home',
        href: '/',
        icon: <Home className="h-5 w-5" />
      },
      {
        title: 'Search',
        href: '#',
        icon: <Search className="h-5 w-5" />,
        isSearchButton: true
      },
    ]
  },
  {
    title: "Financial Management",
    items: [
      {
        title: 'Transactions',
        href: '/transactions',
        icon: <FileText className="h-5 w-5" />
      },
      {
        title: 'Budget',
        href: '/budget',
        icon: <PiggyBank className="h-5 w-5" />
      },
      {
        title: 'Accounts',
        href: '/accounts',
        icon: <CreditCard className="h-5 w-5" />
      },
    ]
  },
  {
    title: "Planning & Scheduling",
    items: [
      {
        title: 'Schedules',
        href: '/schedules',
        icon: <Calendar className="h-5 w-5" />
      },
      {
        title: 'Rules',
        href: '/rules',
        icon: <Filter className="h-5 w-5" />
      },
    ]
  },
  {
    title: "Analysis & Reporting",
    items: [
      {
        title: 'Reports',
        href: '/reports',
        icon: <BarChart4 className="h-5 w-5" />
      },
      {
        title: 'Categories',
        href: '/categories',
        icon: <LineChart className="h-5 w-5" />
      },
      {
        title: 'Reconciliation',
        href: '/reconciliation',
        icon: <FileText className="h-5 w-5" />
      },
    ]
  },
  {
    title: "System",
    items: [
      {
        title: 'Settings',
        href: '/settings',
        icon: <Settings className="h-5 w-5" />
      },
    ]
  },
];

// Flatten items for backward compatibility with existing code
const sidebarNavItems: SidebarNavItem[] = sidebarNavGroups.flatMap(group => group.items);

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentWorkspace, loadWorkspace } = useWorkspace();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("user@example.com");
  const [searchOpen, setSearchOpen] = useState(false);

  // Load all workspaces
  useEffect(() => {
    const fetchWorkspaces = () => {
      try {
        const savedWorkspaces = localStorage.getItem('odzai-workspaces');
        if (savedWorkspaces) {
          setWorkspaces(JSON.parse(savedWorkspaces));
        }
        
        // Set user email (in a real app, this would come from authentication)
        const savedEmail = localStorage.getItem('odzai-user-email');
        if (savedEmail) {
          setUserEmail(savedEmail);
        } else {
          // Default email
          localStorage.setItem('odzai-user-email', 'user@example.com');
        }
      } catch (error) {
        console.error('Error fetching workspaces:', error);
      }
    };

    fetchWorkspaces();
  }, []);
  
  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  // Switch workspace
  const handleSwitchWorkspace = async (workspaceId: string) => {
    setIsLoading(true);
    try {
      const success = await loadWorkspace(workspaceId);
      if (success) {
        toast.success("Workspace switched successfully");
        // Redirect to transactions page or refresh current page
        if (pathname === '/') {
          router.push('/transactions');
        } else {
          router.refresh();
        }
      } else {
        toast.error("Failed to switch workspace");
      }
    } catch (error) {
      console.error('Error switching workspace:', error);
      toast.error("An error occurred while switching workspace");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle restricted navigation
  const handleRestrictedNavigation = (e: React.MouseEvent, href: string) => {
    if (!currentWorkspace) {
      e.preventDefault();
      toast.error("Please load a workspace first");
      router.push('/');
    }
  };
  
  // Logout function
  const handleLogout = () => {
    // Clear current workspace
    localStorage.removeItem('odzai-current-workspace');
    // Navigate to home page
    router.push('/');
    toast.success("Logged out successfully");
  };
  
  // Create a new workspace
  const handleCreateWorkspace = () => {
    router.push('/'); // Navigate to home page where we have the workspace creation UI
  };

  // Get initials for avatar
  const getInitials = (email: string): string => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <div className="group flex flex-col h-full w-full max-w-[250px] border-r bg-background p-4 overflow-hidden">
        <div className="flex flex-col gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="py-2 px-4 mb-4 cursor-pointer hover:bg-muted/50 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">Odzai</h3>
                    <p className="text-sm text-muted-foreground">Financial management</p>
                  </div>
                  <ChevronsUpDown className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px]">
              <div className="flex items-center p-2">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback>{getInitials(userEmail)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-sm font-medium overflow-hidden">
                  <p className="truncate">{userEmail}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 w-7"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              
              <DropdownMenuSeparator />
              
              {/* Available Workspaces */}
              {workspaces.length > 0 && (
                <>
                  {workspaces.map(workspace => (
                    <DropdownMenuItem 
                      key={workspace.id}
                      onClick={() => handleSwitchWorkspace(workspace.id)}
                      disabled={isLoading}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center w-full">
                        <div className="font-mono bg-muted h-7 w-7 flex items-center justify-center rounded mr-2">
                          {workspace.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="flex-1 truncate">{workspace.name}</span>
                        {currentWorkspace?.id === workspace.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                </>
              )}
              
              {/* Add new workspace */}
              <DropdownMenuItem onClick={handleCreateWorkspace} className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                <span>Add a workspace</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Logout */}
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                <span>Logout</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Download app */}
              <DropdownMenuItem onClick={() => window.open('#', '_blank')} className="cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                <span>Download app</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <nav className="grid gap-1 py-2">
            {sidebarNavGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-4">
                {group.title && (  // Only render h3 if title is not empty
                  <h3 className="px-3 mb-1 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    {group.title}
                  </h3>
                )}
                {group.items.map((item) => {
                  const isHome = item.href === '/';
                  const isDisabled = !currentWorkspace && !isHome && !item.isSearchButton;
                  
                  // Handle search button differently
                  if (item.isSearchButton) {
                    return (
                      <button
                        key={item.title}
                        onClick={() => setSearchOpen(true)}
                        className={cn(
                          "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors w-full text-start",
                          "text-muted-foreground hover:bg-muted/50 hover:text-primary"
                        )}
                      >
                        {item.icon && <span className="mr-2">{item.icon}</span>}
                        {item.title}
                        <div className="ml-auto flex items-center justify-center h-5 w-6 rounded border text-xs text-muted-foreground">
                          ⌘K
                        </div>
                      </button>
                    );
                  }
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={isDisabled ? (e) => handleRestrictedNavigation(e, item.href) : undefined}
                      className={cn(
                        "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        pathname === item.href ? "bg-muted text-primary" : "text-muted-foreground",
                        isDisabled ? "opacity-50 cursor-not-allowed hover:bg-transparent" : "hover:bg-muted/50 hover:text-primary",
                        item.indented && "ml-4"
                      )}
                    >
                      {item.icon && <span className="mr-2">{item.icon}</span>}
                      {item.title}
                      {isDisabled && (
                        <span className="ml-auto text-xs text-muted-foreground">(Workspace required)</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto">
          <Link 
            href="/help"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-primary transition-colors"
          >
            <HelpCircle className="mr-2 h-5 w-5" />
            Help & Support
          </Link>
          <div className="px-3 py-4">
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                Workspace: <span className="font-medium text-foreground">{currentWorkspace?.name || 'None Selected'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
} 