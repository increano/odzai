'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from 'lucide-react';

const NavLink = ({ 
  href, 
  children 
}: { 
  href: string; 
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Button 
      variant={isActive ? "default" : "ghost"} 
      asChild
      className={cn(
        "w-full justify-start mb-1 text-left",
        isActive ? "bg-accent font-medium" : ""
      )}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
};

export default function Navigation() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  return (
    <>
      {/* Mobile nav toggle button */}
      <button 
        onClick={toggleMobileNav} 
        className="md:hidden fixed z-50 bottom-4 right-4 bg-primary text-primary-foreground p-3 rounded-full shadow-lg"
      >
        {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop sidebar nav */}
      <nav className="w-64 bg-card border-r h-full flex-shrink-0 p-4 hidden md:block">
        <div className="flex flex-col space-y-1">
          <h2 className="font-semibold mb-4 text-sm uppercase text-muted-foreground px-2">Menu</h2>
          <NavLink href="/">Dashboard</NavLink>
          <NavLink href="/budgets">Budgets</NavLink>
          <NavLink href="/accounts">Accounts</NavLink>
          <NavLink href="/transactions">Transactions</NavLink>
          <NavLink href="/budget">Budget</NavLink>
          <NavLink href="/categories">Categories</NavLink>
          <NavLink href="/reports">Reports</NavLink>
          <NavLink href="/schedules">Schedules</NavLink>
          <NavLink href="/reconciliation">Reconcile</NavLink>
        </div>
      </nav>

      {/* Mobile nav panel */}
      {mobileNavOpen && (
        <div className="fixed inset-0 bg-background z-40 md:hidden">
          <div className="p-4 pt-20">
            <div className="flex flex-col space-y-1">
              <NavLink href="/">Dashboard</NavLink>
              <NavLink href="/budgets">Budgets</NavLink>
              <NavLink href="/accounts">Accounts</NavLink>
              <NavLink href="/transactions">Transactions</NavLink>
              <NavLink href="/budget">Budget</NavLink>
              <NavLink href="/categories">Categories</NavLink>
              <NavLink href="/reports">Reports</NavLink>
              <NavLink href="/schedules">Schedules</NavLink>
              <NavLink href="/reconciliation">Reconcile</NavLink>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 