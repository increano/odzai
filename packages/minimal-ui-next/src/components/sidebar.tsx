'use client'

import { useState, useEffect } from 'react'
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
  Plus
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
} from "@/components/ui/dropdown-menu"

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
}

// Create a type for grouped navigation
type NavigationGroup = {
  title: string;
  items: NavigationItem[];
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  // Use our custom hook with a default value of false (expanded)
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(SIDEBAR_STATE_KEY, false)
  const { openSettingsModal } = useSettingsModal()
  const { isWorkspaceLoaded, currentWorkspace } = useWorkspace()
  
  // Mock user data (this would come from a context or API in a real app)
  const [userData, setUserData] = useState({
    name: "Fabrice Muhirwa",
    email: "fmuhirwa@gmail.com",
    initials: "FM"
  })
  
  // Mock available workspaces (this would come from a context or API in a real app)
  const [availableWorkspaces, setAvailableWorkspaces] = useState([
    { id: "1", name: "Family Budget", color: "#FF7043" },
    { id: "2", name: "Personal Finances", color: "#42A5F5" },
    { id: "3", name: "Business Expenses", color: "#66BB6A" }
  ])

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }
  
  // Function to handle workspace switching
  const switchWorkspace = (workspace: any) => {
    router.push('/budgets')
  }
  
  // Function to open settings to the general tab
  const openWorkspaceSettings = () => {
    if (openSettingsModal) {
      openSettingsModal("general")
    }
  }

  // Function to handle workspace unloading
  const handleUnloadWorkspace = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('odzai-current-workspace')
      // Force a page reload to reset the workspace context
      window.location.href = '/budgets'
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
        { name: 'Workspaces', href: '/budgets', icon: Wallet },
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

  // Test section shown between planning and settings
  const TestSection = ({ collapsed }: { collapsed: boolean }) => (
    <div className="mb-6">
      {!collapsed && (
        <div className="mb-2 px-3">
          <h3 className="text-xs font-semibold text-muted-foreground tracking-wider">
            TEST
          </h3>
        </div>
      )}
      <div className="grid gap-1">
        <button
          onClick={handleUnloadWorkspace}
          disabled={!isWorkspaceLoaded}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors w-full text-left",
            isWorkspaceLoaded ? "text-red-500 hover:bg-red-100/30" : "text-muted-foreground opacity-50"
          )}
          title={collapsed ? "Unload Workspace (Test)" : undefined}
        >
          <Wallet className={cn(
            "h-5 w-5 transition-all duration-300 ease-in-out",
            collapsed ? "mr-0" : "mr-0"
          )} />
          <span className={cn(
            "transition-all duration-300 ease-in-out whitespace-nowrap",
            collapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
          )}>
            Unload Workspace
          </span>
        </button>
      </div>
    </div>
  )

  // Settings navigation items (kept separate for the footer)
  const settingsNavigation = [
    { 
      name: 'Settings', 
      icon: Settings, 
      onClick: openWorkspaceSettings
    },
    { 
      name: 'Help', 
      href: '/help', 
      icon: HelpCircle 
    },
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
                  : "hover:bg-accent/50"
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
                "hover:bg-accent/50"
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
                  : "hover:bg-accent/50"
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
                "hover:bg-accent/50"
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
    <div className={cn(
      "border-b pb-3 transition-all duration-300 ease-in-out",
      collapsed ? "px-2" : "px-3"
    )}>
      {collapsed ? (
        <div className="flex justify-center py-2">
          {isWorkspaceLoaded && currentWorkspace ? (
            <div 
              className="h-8 w-8 rounded-md flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: currentWorkspace.color }}
            >
              {currentWorkspace.name.charAt(0)}
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => router.push('/budgets')}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isWorkspaceLoaded && currentWorkspace ? (
              <button className="w-full flex items-center justify-between gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors bg-accent text-accent-foreground">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-8 w-8 rounded-md flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: currentWorkspace.color }}
                  >
                    {currentWorkspace.name.charAt(0)}
                  </div>
                  <div className="flex flex-col items-start max-w-[120px]">
                    <span className="text-sm font-medium truncate w-full">{currentWorkspace.name}</span>
                    <span className="text-xs text-muted-foreground">Current workspace</span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            ) : (
              <button 
                className="w-full flex items-center justify-between gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors"
                onClick={() => router.push('/budgets')}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md flex items-center justify-center bg-muted">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">Select Workspace</span>
                    <span className="text-xs text-muted-foreground">No workspace loaded</span>
                  </div>
                </div>
              </button>
            )}
          </DropdownMenuTrigger>
          {isWorkspaceLoaded && currentWorkspace && (
            <DropdownMenuContent align="start" className="w-[220px]">
              <div className="px-2 py-1.5">
                <h3 className="text-sm font-medium mb-1">Switch workspace</h3>
                <p className="text-xs text-muted-foreground mb-2">Your available workspaces</p>
              </div>
              {availableWorkspaces.map(workspace => (
                <DropdownMenuItem 
                  key={workspace.id}
                  className="flex items-center gap-2 py-2"
                  onClick={() => switchWorkspace(workspace)}
                >
                  <div 
                    className="h-6 w-6 rounded-md flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: workspace.color }}
                  >
                    {workspace.name.charAt(0)}
                  </div>
                  <span className="text-sm">{workspace.name}</span>
                  {workspace.id === currentWorkspace.id && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-primary"></div>
                  )}
                </DropdownMenuItem>
              ))}
              <div className="border-t mt-1 pt-1">
                <DropdownMenuItem onClick={() => router.push('/budgets')}>
                  <span className="text-sm">Manage workspaces</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      )}
    </div>
  )
  
  // Mobile workspace selector
  const MobileWorkspaceSelector = () => (
    <div className="border-b pb-3 px-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {isWorkspaceLoaded && currentWorkspace ? (
            <button className="w-full flex items-center justify-between gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors bg-accent text-accent-foreground">
              <div className="flex items-center gap-2">
                <div 
                  className="h-8 w-8 rounded-md flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: currentWorkspace.color }}
                >
                  {currentWorkspace.name.charAt(0)}
                </div>
                <div className="flex flex-col items-start max-w-[120px]">
                  <span className="text-sm font-medium truncate w-full">{currentWorkspace.name}</span>
                  <span className="text-xs text-muted-foreground">Current workspace</span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <button 
              className="w-full flex items-center justify-between gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors"
              onClick={() => router.push('/budgets')}
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md flex items-center justify-center bg-muted">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Select Workspace</span>
                  <span className="text-xs text-muted-foreground">No workspace loaded</span>
                </div>
              </div>
            </button>
          )}
        </DropdownMenuTrigger>
        {isWorkspaceLoaded && currentWorkspace && (
          <DropdownMenuContent align="start" className="w-[220px]">
            <div className="px-2 py-1.5">
              <h3 className="text-sm font-medium mb-1">Switch workspace</h3>
              <p className="text-xs text-muted-foreground mb-2">Your available workspaces</p>
            </div>
            {availableWorkspaces.map(workspace => (
              <DropdownMenuItem 
                key={workspace.id}
                className="flex items-center gap-2 py-2"
                onClick={() => switchWorkspace(workspace)}
              >
                <div 
                  className="h-6 w-6 rounded-md flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: workspace.color }}
                >
                  {workspace.name.charAt(0)}
                </div>
                <span className="text-sm">{workspace.name}</span>
                {workspace.id === currentWorkspace.id && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary"></div>
                )}
              </DropdownMenuItem>
            ))}
            <div className="border-t mt-1 pt-1">
              <DropdownMenuItem onClick={() => router.push('/budgets')}>
                <span className="text-sm">Manage workspaces</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        )}
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
                          : "hover:bg-accent/50"
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
                        "hover:bg-accent/50"
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
          <TestSection collapsed={collapsed} />
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
                      : "hover:bg-accent/50"
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
                    "hover:bg-accent/50"
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