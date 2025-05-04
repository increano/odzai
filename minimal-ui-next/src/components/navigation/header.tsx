'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Search, Menu, X, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sheet,
  SheetContent,
  SheetTrigger
} from '@/components/ui/sheet';
import { useState } from 'react';
import { Sidebar } from './sidebar';

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarVisible: boolean;
}

interface Breadcrumb {
  label: string;
  href: string;
}

// Function to generate breadcrumbs based on the current path
const generateBreadcrumbs = (pathname: string): Breadcrumb[] => {
  const paths = pathname.split('/').filter(Boolean);
  
  if (paths.length === 0) return [{ label: 'Home', href: '/' }];
  
  const breadcrumbs: Breadcrumb[] = [{ label: 'Home', href: '/' }];
  
  let constructedPath = '';
  paths.forEach((path) => {
    constructedPath += `/${path}`;
    breadcrumbs.push({
      label: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
      href: constructedPath
    });
  });
  
  return breadcrumbs;
};

export function Header({ toggleSidebar, sidebarVisible }: HeaderProps) {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-14 items-center px-4">
        {/* Mobile menu */}
        <div className="flex lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Sidebar toggle button - visible only on desktop */}
        <div className="hidden lg:flex mr-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleSidebar}
            className="text-muted-foreground hover:text-foreground"
          >
            {sidebarVisible ? 
              <PanelLeftClose className="h-5 w-5" /> : 
              <PanelLeft className="h-5 w-5" />
            }
            <span className="sr-only">
              {sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
            </span>
          </Button>
        </div>

        <div className="flex items-center">
          <nav className="flex items-center space-x-1 text-sm font-medium">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center">
                {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
                <Link 
                  href={crumb.href}
                  className={index === breadcrumbs.length - 1 
                    ? "font-semibold text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                  }
                >
                  {crumb.label}
                </Link>
              </div>
            ))}
          </nav>
        </div>

        <div className="ml-auto flex items-center space-x-2">
          {isSearchOpen ? (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-[200px] pl-8 md:w-[300px] rounded-md"
                autoFocus
                onBlur={() => setIsSearchOpen(false)}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0"
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
} 