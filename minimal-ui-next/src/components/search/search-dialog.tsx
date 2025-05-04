"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  History, 
  FileText, 
  CreditCard, 
  Tag, 
  PiggyBank, 
  Calendar,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Focus the input field when the dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure the dialog is fully rendered
      const timer = setTimeout(() => {
        const input = document.getElementById("search-input");
        if (input) {
          input.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle keyboard shortcut to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Mock recent searches
  const recentSearches = [
    { text: "Monthly expenses", type: "transactions" },
    { text: "Savings account", type: "account" },
    { text: "Groceries", type: "category" },
  ];

  // Handle search submission
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Close dialog
    onOpenChange(false);
    
    // Navigate to search results page (in a real app)
    // Here we just redirect to the transactions page as an example
    router.push(`/transactions?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-input"
                placeholder="Search transactions, accounts, categories..."
                className="pl-9 pr-12 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="px-4 py-2 border-t">
          <div className="flex items-center gap-2 mb-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Recent Searches</h3>
          </div>
          {recentSearches.length > 0 ? (
            <div className="space-y-1">
              {recentSearches.map((item, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => {
                    setSearchQuery(item.text);
                    handleSearch();
                  }}
                >
                  {item.type === "transactions" && <FileText className="h-4 w-4 text-muted-foreground" />}
                  {item.type === "account" && <CreditCard className="h-4 w-4 text-muted-foreground" />}
                  {item.type === "category" && <Tag className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-2">
              No recent searches
            </p>
          )}
        </div>

        <div className="px-4 py-3 border-t bg-muted/40">
          <p className="text-xs text-muted-foreground">
            Search by type: <span className="font-medium">account:</span> <span className="font-medium">transaction:</span> <span className="font-medium">category:</span> <span className="font-medium">date:</span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 