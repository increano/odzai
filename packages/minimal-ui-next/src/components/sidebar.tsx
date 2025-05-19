'use client'

import { useState, useEffect, MouseEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Home, 
  Wallet, 
  CreditCard, 
  Receipt, 
  Settings, 
  HelpCircle, 
  PanelLeft,
  Menu,
  BarChart2,
  Target,
  Calendar,
  Clock,
  Building2,
  ChevronDown,
  Plus,
  LogOut,
  Check,
  X,
  Users,
  Bell,
  ShieldAlert,
  ActivitySquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useSettingsModal } from './SettingsModalProvider'
import { useWorkspace } from './WorkspaceProvider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'
import { useUser } from '@/hooks/useUser'

// Key used for localStorage
const SIDEBAR_STATE_KEY = 'odzai-sidebar-collapsed'

// Custom hook for persistent state
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Initialize with the provided default to avoid any flashing
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  
  // Load from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key)
        if (item) {
          setStoredValue(item === 'true' ? true as T : item === 'false' ? false as T : JSON.parse(item))
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error)
    }
  }, [key])
  
  // Update localStorage when state changes
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function for previous state pattern
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Save state
      setStoredValue(valueToStore)
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        if (typeof valueToStore === 'boolean') {
          window.localStorage.setItem(key, String(valueToStore))
        } else {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }
  
  return [storedValue, setValue]
}

interface SidebarProps {
  className?: string
}

// Create a type for navigation items with optional section
type NavigationItem = {
  name: string;
  href?: string;
  icon: React.FC<{ className?: string }>;
  onClick?: () => void;
  className?: string;
}

// Create a type for grouped navigation
type NavigationGroup = {
  title: string;
  items: NavigationItem[];
}

// Define our own type matching the currentWorkspace properties
interface WorkspaceInfo {
  id: string;
  name: string;
  color: string;
  originalName?: string;
  displayName?: string;
}

// Helper function to get the stored custom display name for a workspace
const getStoredDisplayName = (id: string): string | null => {
  try {
    if (typeof window !== 'undefined') {
      const storedNames = localStorage.getItem('odzai-workspace-names');
      if (storedNames) {
        const namesObj = JSON.parse(storedNames);
        return namesObj[id] || null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting stored display name:', error);
    return null;
  }
};

// Add this helper function near the top of the file, after imports and before the component
const getCleanWorkspaceName = (name: string): string => {
  if (!name) return '';
  
  // If the name contains a dash, extract the part before it
  if (name.includes('-')) {
    const namePart = name.split('-')[0];
    // Capitalize first letter if it's not already
    return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
  }
  
  // If no dash, return the name as is
  return name;
};

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  // Use our custom hook with a default value of false (expanded)
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(SIDEBAR_STATE_KEY, false)
  const { openSettingsModal } = useSettingsModal()
  const { isWorkspaceLoaded, currentWorkspace, loadWorkspace, loadingWorkspace, isDefaultWorkspace } = useWorkspace()
  const { user, isAdmin } = useUser()
  
  // Add state to control the dropdown open/close state
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false)

  // Mock user data (this would come from a context or API in a real app)
  const [userData, setUserData] = useState({
    name: "Fabrice Muhirwa",
    email: "fmuhirwa@gmail.com",
    initials: "FM"
  })
  
  // State for available workspaces from API
  const [availableWorkspaces, setAvailableWorkspaces] = useState<WorkspaceInfo[]>([])
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false)
  
  // State for tracking selected workspace when none is loaded
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('')
  const [loadingSelectedWorkspace, setLoadingSelectedWorkspace] = useState(false)

  // Add a useEffect to automatically open the dropdowns on the home page
  useEffect(() => {
    // Check if we're on the home page
    if (pathname === '/') {
      // Set a small delay to ensure the component is fully mounted
      const timer = setTimeout(() => {
        // If no workspace is loaded, open the dropdown
        if (!isWorkspaceLoaded) {
          setDropdownOpen(true)
          setMobileDropdownOpen(true)
        }
      }, 300) // Reduced delay for better responsiveness
      
      return () => clearTimeout(timer)
    } else {
      // When navigating away from home page, close the dropdowns
      setDropdownOpen(false)
      setMobileDropdownOpen(false)
    }
  }, [pathname, isWorkspaceLoaded])

  // Add an effect to refresh state when URL changes (for router.refresh() to work properly)
  useEffect(() => {
    // When the pathname changes, make sure our workspace state is fresh
    if (isWorkspaceLoaded && currentWorkspace) {
      // Fetch the latest workspaces
      fetchAvailableWorkspaces();
    }
  }, [pathname]);

  // Update selectedWorkspaceId when currentWorkspaceId changes
  useEffect(() => {
    if (currentWorkspace && currentWorkspace.id) {
      setSelectedWorkspaceId(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  // Add a useEffect to refresh workspaces when the currentWorkspace changes
  useEffect(() => {
    if (currentWorkspace) {
      fetchAvailableWorkspaces();
    }
  }, [currentWorkspace?.id, currentWorkspace?.name, currentWorkspace?.displayName]);

  // Fetch available workspaces on component mount
  useEffect(() => {
    fetchAvailableWorkspaces()
  }, [])

  // Function to fetch available workspaces from API
  const fetchAvailableWorkspaces = async () => {
    setIsLoadingWorkspaces(true)
    try {
      const response = await fetch('/api/budgets')
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces')
      }
      
      const data = await response.json()
      
      // If the API response doesn't include colors, add default colors
      const workspacesWithColors = data.map((workspace: any, index: number) => {
        // Array of colors for workspaces if not provided by API
        const defaultColors = ["#FF7043", "#42A5F5", "#66BB6A", "#AB47BC", "#EC407A", "#7E57C2"]
        
        // Get clean name for display
        const displayName = workspace.displayName || getCleanWorkspaceName(workspace.name);
        
        return {
          ...workspace,
          originalName: workspace.name, // Keep original full ID
          name: displayName, // Use clean name for display
          color: workspace.color || defaultColors[index % defaultColors.length]
        }
      })
      
      setAvailableWorkspaces(workspacesWithColors)
    } catch (error) {
      console.error('Error fetching workspaces:', error)
      toast.error('Failed to load available workspaces')
      // Fallback to empty array
      setAvailableWorkspaces([])
    } finally {
      setIsLoadingWorkspaces(false)
    }
  }

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }
  
  // Function to handle workspace switching
  const switchWorkspace = (workspace: any) => {
    // Validate workspace object
    if (!workspace || !workspace.id) {
      toast.error('Invalid workspace selected')
      return
    }

    // Always use the handleLoadSelectedWorkspace for both initial loading and switching
    handleLoadSelectedWorkspace(workspace.id)
  }
  
  // Function to load a workspace from selection
  const handleLoadSelectedWorkspace = async (workspaceId: string) => {
    if (!workspaceId) {
      toast.error('Please select a workspace to load')
      return
    }
    
    setLoadingSelectedWorkspace(true)
    
    try {
      // First try to load the workspace via the API
      const response = await fetch('/api/budgets/load', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ budgetId: workspaceId }),
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to load workspace'
        try {
          const errorData = await response.json()
          if (errorData.message || errorData.error) {
            errorMessage = errorData.message || errorData.error
          }
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }
      
      // Now that backend load succeeded, use the workspace provider to update the app state
      loadWorkspace(workspaceId)
      
      // Reset the selected workspace ID in the dropdown
      setSelectedWorkspaceId('')
      
      // Use Next.js router to navigate to home instead of reload
      router.push('/')
      
    } catch (error) {
      console.error('Error loading workspace:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to load workspace')
    } finally {
      setLoadingSelectedWorkspace(false)
    }
  }

  // Function to open settings to the general tab
  const openWorkspaceSettings = () => {
    if (openSettingsModal) {
      openSettingsModal("general")
    }
  }

  // Function to open settings to the account tab
  const openAccountSettings = () => {
    if (openSettingsModal) {
      openSettingsModal("account")
    }
  }

  // Handle user logout
  const handleLogout = () => {
    // Clear the current workspace from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('odzai-current-workspace')
      
      // You would typically clear auth tokens here too
      // localStorage.removeItem('auth-token')
      
      // Show toast notification
      toast.success('Logged out successfully')
      
      // Use Next.js router instead of direct window location navigation
      router.push('/')
    }
  }

  // Grouped navigation structure
  const navigationGroups: NavigationGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Reports', href: '/reports', icon: BarChart2 },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { name: 'Accounts', href: '/accounts', icon: CreditCard },
        { name: 'Transactions', href: '/transactions', icon: Receipt },
        { name: 'Budget', href: '/budget', icon: LayoutDashboard },
      ]
    },
    {
      title: 'PLANNING',
      items: [
        { name: 'Goals', href: '/goals', icon: Target },
        { name: 'Schedules', href: '/schedules', icon: Calendar },
      ]
    },
  ]

  // Add Admin section if user is admin
  if (user?.isAdmin) {
    navigationGroups.push({
      title: 'ADMIN',
      items: [
        { 
          name: 'Performance Alerts', 
          href: '/admin/performance-alerts', 
          icon: ActivitySquare,
          className: "text-blue-600 hover:bg-blue-50/30"
        },
        // Add more admin tools here in the future
      ]
    })
  }

  // Settings navigation items (kept separate for the footer)
  const settingsNavigation = [
    { 
      name: 'Settings', 
      icon: Settings, 
      onClick: openAccountSettings
    },
    { 
      name: 'Help', 
      href: '/help', 
      icon: HelpCircle 
    },
    {
      name: 'Logout',
      icon: LogOut,
      onClick: handleLogout,
      className: "text-red-500 hover:bg-red-50/30"
    }
  ]

  // Component for rendering a navigation group in desktop sidebar
  const NavGroup = ({ group, collapsed }: { group: NavigationGroup; collapsed: boolean }) => (
    <div className="mb-6">
      {!collapsed && (
        <div className="mb-2 px-3">
          <h3 className="text-xs font-semibold text-muted-foreground tracking-wider">
            {group.title}
          </h3>
        </div>
      )}
      <div className="grid gap-1">
        {group.items.map((item) => (
          item.href ? (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50",
                item.className
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-all duration-300 ease-in-out",
                collapsed ? "mr-0" : "mr-0"
              )} />
              <span className={cn(
                "transition-all duration-300 ease-in-out whitespace-nowrap",
                collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
              )}>
                {item.name}
              </span>
            </Link>
          ) : (
            <button
              key={item.name}
              onClick={item.onClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors w-full text-left",
                "hover:bg-accent/50",
                item.className
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-all duration-300 ease-in-out",
                collapsed ? "mr-0" : "mr-0"
              )} />
              <span className={cn(
                "transition-all duration-300 ease-in-out whitespace-nowrap",
                collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
              )}>
                {item.name}
              </span>
            </button>
          )
        ))}
      </div>
    </div>
  )

  // Component for rendering a navigation group in mobile sidebar
  const MobileNavGroup = ({ group }: { group: NavigationGroup }) => (
    <div className="mb-4">
      <div className="mb-2 px-3">
        <h3 className="text-xs font-semibold text-muted-foreground tracking-wider">
          {group.title}
        </h3>
      </div>
      <div className="grid gap-1">
        {group.items.map((item) => (
          item.href ? (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50",
                item.className
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ) : (
            <button
              key={item.name}
              onClick={item.onClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors w-full text-left",
                "hover:bg-accent/50",
                item.className
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </button>
          )
        ))}
      </div>
    </div>
  )

  // Component for workspace selector
  const WorkspaceSelector = ({ collapsed }: { collapsed: boolean }) => (
    <div className="flex-none px-2 py-2">
      <div className="overflow-hidden">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full text-left flex items-center gap-2 py-2",
                { "justify-center": collapsed }
              )} 
              size="sm"
            >
              {isWorkspaceLoaded && currentWorkspace ? (
                <>
                  <div 
                    className={cn(
                      "h-6 w-6 rounded-md flex items-center justify-center text-white text-xs font-medium relative",
                      { "mx-auto": collapsed }
                    )}
                    style={{ backgroundColor: currentWorkspace.color || '#FF7043' }}
                  >
                    {(currentWorkspace.displayName || getStoredDisplayName(currentWorkspace.id) || getCleanWorkspaceName(currentWorkspace.name)).charAt(0)}
                    {isDefaultWorkspace(currentWorkspace.id) && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border border-white"></div>
                    )}
                  </div>
                  <div className={cn(
                    "flex flex-1 flex-col gap-0 whitespace-nowrap transition-all duration-300 ease-in-out",
                    collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                  )}>
                    <span className="text-sm font-medium">{currentWorkspace.displayName || getStoredDisplayName(currentWorkspace.id) || getCleanWorkspaceName(currentWorkspace.name)}</span>
                    <span className="text-xs text-muted-foreground flex items-center">
                      Workspace
                      {isDefaultWorkspace(currentWorkspace.id) && (
                        <span className="ml-1 text-xs text-green-600 font-medium flex items-center">
                          · Default <Check className="h-3 w-3 ml-0.5" />
                        </span>
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className={cn(
                    "h-6 w-6 rounded-md bg-primary/20 animate-pulse",
                    { "mx-auto": collapsed }
                  )}></div>
                  {!collapsed && (
                    <div className="flex flex-col gap-0">
                      <div className="h-3 w-24 bg-primary/20 rounded-sm animate-pulse"></div>
                      <div className="h-3 w-16 bg-primary/20 rounded-sm animate-pulse mt-1"></div>
                    </div>
                  )}
                </>
              )}
              <ChevronDown className={cn(
                "h-4 w-4 ml-auto transition-transform duration-300",
                dropdownOpen ? "rotate-180" : "rotate-0",
                collapsed ? "hidden" : "block"
              )} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[220px]" forceMount={true}>
            <div className="px-2 py-1.5">
              <h3 className="text-sm font-medium mb-1">
                {isWorkspaceLoaded ? "Switch workspace" : "Select a workspace"}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">Your available workspaces</p>
            </div>
            {isLoadingWorkspaces ? (
              <DropdownMenuItem disabled>
                <span className="text-sm">Loading workspaces...</span>
              </DropdownMenuItem>
            ) : availableWorkspaces.length === 0 ? (
              <DropdownMenuItem disabled>
                <span className="text-sm">No workspaces found</span>
              </DropdownMenuItem>
            ) : (
              <div className="max-h-[135px] overflow-y-auto pr-1 py-1">
                {availableWorkspaces.map(workspace => (
                  <DropdownMenuItem 
                    key={workspace.id}
                    className="flex items-center gap-2 py-2"
                    onClick={() => switchWorkspace(workspace)}
                  >
                    <div 
                      className="h-6 w-6 rounded-md flex items-center justify-center text-white text-xs font-medium relative"
                      style={{ backgroundColor: workspace.color }}
                    >
                      {(workspace.displayName || getStoredDisplayName(workspace.id) || workspace.name).charAt(0)}
                      {isDefaultWorkspace(workspace.id) && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border border-white"></div>
                      )}
                    </div>
                    <span className="text-sm">{workspace.displayName || getStoredDisplayName(workspace.id) || workspace.name}</span>
                    {isDefaultWorkspace(workspace.id) && (
                      <span className="ml-auto text-xs text-green-600 font-medium flex items-center gap-0.5">
                        Default <Check className="h-3 w-3" />
                      </span>
                    )}
                    {isWorkspaceLoaded && currentWorkspace && workspace.id === currentWorkspace.id && !isDefaultWorkspace(workspace.id) && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary"></div>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            )}
            <div className="border-t mt-1 pt-1">
              <DropdownMenuItem onClick={() => openWorkspaceSettings()}>
                <span className="text-sm">Manage workspaces</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
  
  // Mobile workspace selector
  const MobileWorkspaceSelector = () => (
    <div className="flex flex-col px-4 py-3 border-b">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {isWorkspaceLoaded 
            ? (currentWorkspace?.displayName || getStoredDisplayName(currentWorkspace?.id || '') || getCleanWorkspaceName(currentWorkspace?.name || '')) 
            : "Select a workspace"}
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8"
          onClick={() => openWorkspaceSettings()}
        >
          <Settings className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">Settings</span>
        </Button>
      </div>
      {isWorkspaceLoaded && currentWorkspace ? (
        <div className="flex items-center gap-3">
          <div 
            className="h-8 w-8 rounded-md flex items-center justify-center text-white font-medium relative"
            style={{ backgroundColor: currentWorkspace.color }}
          >
            {(currentWorkspace.displayName || getStoredDisplayName(currentWorkspace.id) || getCleanWorkspaceName(currentWorkspace.name)).charAt(0)}
            {isDefaultWorkspace(currentWorkspace.id) && (
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border border-white"></div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{currentWorkspace.displayName || getStoredDisplayName(currentWorkspace.id) || getCleanWorkspaceName(currentWorkspace.name)}</span>
            <span className="text-xs text-muted-foreground flex items-center">
              Current workspace
              {isDefaultWorkspace(currentWorkspace.id) && (
                <span className="ml-1 text-xs text-green-600 font-medium flex items-center">
                  · Default <Check className="h-3 w-3 ml-0.5" />
                </span>
              )}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-accent/50 rounded-md px-3 py-2">
          <p className="text-sm mb-1">No workspace selected</p>
          <p className="text-xs text-muted-foreground">Please select a workspace to continue</p>
        </div>
      )}
      <DropdownMenu open={mobileDropdownOpen} onOpenChange={setMobileDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between mt-2">
            <span>
              {isWorkspaceLoaded ? "Switch workspace" : "Select workspace"}
            </span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[300px]">
          <div className="px-2 py-1.5">
            <h3 className="text-sm font-medium">Available workspaces</h3>
            <p className="text-xs text-muted-foreground">Select a workspace to load</p>
          </div>
          {isLoadingWorkspaces ? (
            <DropdownMenuItem disabled>
              <div className="flex items-center gap-2 py-2">
                <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-primary animate-spin"></div>
                <span>Loading workspaces...</span>
              </div>
            </DropdownMenuItem>
          ) : availableWorkspaces.length === 0 ? (
            <DropdownMenuItem disabled>
              <div className="py-2">
                <p className="text-sm">No workspaces found</p>
                <p className="text-xs text-muted-foreground">Create a new workspace to get started</p>
              </div>
            </DropdownMenuItem>
          ) : (
            <div className="max-h-[200px] overflow-y-auto py-1">
              {availableWorkspaces.map(workspace => (
                <DropdownMenuItem 
                  key={workspace.id}
                  className="flex items-center gap-2 py-2"
                  onClick={() => {
                    switchWorkspace(workspace);
                    setMobileDropdownOpen(false);
                  }}
                >
                  <div 
                    className="h-6 w-6 rounded-md flex items-center justify-center text-white text-xs font-medium relative"
                    style={{ backgroundColor: workspace.color }}
                  >
                    {(workspace.displayName || getStoredDisplayName(workspace.id) || workspace.name).charAt(0)}
                    {isDefaultWorkspace(workspace.id) && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border border-white"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm block">{workspace.displayName || getStoredDisplayName(workspace.id) || workspace.name}</span>
                    {isDefaultWorkspace(workspace.id) && (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                        Default workspace <Check className="h-3 w-3 ml-0.5" />
                      </span>
                    )}
                  </div>
                  {isWorkspaceLoaded && currentWorkspace && workspace.id === currentWorkspace.id && !isDefaultWorkspace(workspace.id) && (
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="flex items-center gap-2 py-2"
            onClick={() => {
              setMobileDropdownOpen(false);
              openWorkspaceSettings();
            }}
          >
            <Settings className="h-4 w-4" />
            <span>Manage workspaces</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <>
      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed top-4 left-4 z-50">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] sm:w[300px] p-0">
          <div className="h-full flex flex-col bg-background rounded-r-lg shadow-lg">
            <div className="border-b py-4 px-6">
              <button 
                onClick={() => openSettingsModal("account")} 
                className="flex items-center bg-accent/50 py-1 px-2 rounded-md transition-colors text-left w-full hover:bg-accent"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                  <span className="font-medium text-sm">{userData.initials}</span>
                </div>
                <div>
                  <p className="font-medium">{userData.name}</p>
                  <p className="text-xs text-muted-foreground">{userData.email}</p>
                </div>
              </button>
            </div>
            <MobileWorkspaceSelector />
            <div className="flex-1 overflow-auto py-4 px-2">
              {navigationGroups.map((group) => (
                <MobileNavGroup key={group.title} group={group} />
              ))}
            </div>
            <div className="mt-auto border-t p-4">
              <div className="mb-2 px-1">
                <h3 className="text-xs font-semibold text-muted-foreground tracking-wider">
                  SETTINGS
                </h3>
              </div>
              <nav className="grid gap-1">
                {settingsNavigation.map((item) => (
                  item.href ? (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50",
                        item.className
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  ) : (
                    <button
                      key={item.name}
                      onClick={item.onClick}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors w-full text-left",
                        "hover:bg-accent/50",
                        item.className
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </button>
                  )
                ))}
              </nav>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className={cn(
        "hidden h-[calc(100vh-32px)] my-4 ml-4 rounded-lg border bg-background md:flex flex-col transition-all duration-300 ease-in-out shadow-md",
        collapsed ? "w-[90px]" : "w-[260px]",
        className
      )}>
        <div className={cn(
          "flex h-14 items-center px-4 transition-all duration-300 ease-in-out",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            <button 
              onClick={() => openSettingsModal("account")}
              className="flex items-center bg-accent/50 py-1 px-2 rounded-md transition-colors text-left w-full hover:bg-accent"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                <span className="font-medium text-xs">{userData.initials}</span>
              </div>
              <div>
                <p className="font-medium text-sm">{userData.name}</p>
                <p className="text-xs text-muted-foreground">{userData.email}</p>
              </div>
            </button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="transition-all duration-300 ease-in-out"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className={cn(
              "h-5 w-5 transition-transform duration-300",
              collapsed ? "rotate-180" : "rotate-0"
            )} />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>
        <WorkspaceSelector collapsed={collapsed} />
        <div className="flex-1 overflow-y-auto py-4 px-2">
          {navigationGroups.map((group) => (
            <NavGroup key={group.title} group={group} collapsed={collapsed} />
          ))}
        </div>
        <div className="mt-auto border-t p-4">
          {!collapsed && (
            <div className="mb-2 px-1">
              <h3 className="text-xs font-semibold text-muted-foreground tracking-wider">
                SETTINGS
              </h3>
            </div>
          )}
          <nav className="grid gap-1">
            {settingsNavigation.map((item) => (
              item.href ? (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50",
                    item.className
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  <span className={cn(
                    "transition-all duration-300 ease-in-out whitespace-nowrap",
                    collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                  )}>
                    {item.name}
                  </span>
                </Link>
              ) : (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors w-full text-left",
                    "hover:bg-accent/50",
                    item.className
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5" />
                  <span className={cn(
                    "transition-all duration-300 ease-in-out whitespace-nowrap",
                    collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                  )}>
                    {item.name}
                  </span>
                </button>
              )
            ))}
          </nav>
        </div>
      </div>
    </>
  )
} 