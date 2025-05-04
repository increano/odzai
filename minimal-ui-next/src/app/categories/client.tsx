'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  ChevronRight,
  ChevronDown,
  MoveVertical,
  GripVertical,
  FolderPlus,
  Tag
} from "lucide-react";

// Types
interface CategoryGroup {
  id: string;
  name: string;
  is_income: boolean;
  sort_order: number;
  hidden?: boolean;
}

interface Category {
  id: string;
  name: string;
  groupId: string;
  sort_order: number;
  hidden?: boolean;
  is_income?: boolean;
  notes?: string;
  goal?: {
    type: 'target' | 'monthly' | null;
    amount: number;
    due_date?: string;
  } | null;
}

// Statistical data for categories
interface CategoryStats {
  categoryId: string;
  totalSpent: number;
  averageSpent: number;
  lastUsed: string;
  transactionCount: number;
}

export default function CategoriesClient() {
  // State
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Dialog states
  const [newCategoryGroup, setNewCategoryGroup] = useState<Partial<CategoryGroup>>({
    is_income: false,
    sort_order: 0
  });
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    sort_order: 0,
    hidden: false
  });
  const [editingCategoryGroup, setEditingCategoryGroup] = useState<CategoryGroup | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false);
  
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount / 100);
  };

  // Toggle group expansion
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Mock category groups
        const mockCategoryGroups: CategoryGroup[] = [
          { id: 'group1', name: 'Immediate Obligations', is_income: false, sort_order: 1 },
          { id: 'group2', name: 'True Expenses', is_income: false, sort_order: 2 },
          { id: 'group3', name: 'Quality of Life', is_income: false, sort_order: 3 },
          { id: 'group4', name: 'Savings Goals', is_income: false, sort_order: 4 },
          { id: 'group5', name: 'Income', is_income: true, sort_order: 5 },
        ];
        
        // Mock categories
        const mockCategories: Category[] = [
          // Immediate Obligations
          { id: 'cat1', name: 'Rent/Mortgage', groupId: 'group1', sort_order: 1 },
          { id: 'cat2', name: 'Electricity', groupId: 'group1', sort_order: 2 },
          { id: 'cat3', name: 'Water', groupId: 'group1', sort_order: 3 },
          { id: 'cat4', name: 'Internet', groupId: 'group1', sort_order: 4 },
          { id: 'cat5', name: 'Groceries', groupId: 'group1', sort_order: 5 },
          
          // True Expenses
          { id: 'cat6', name: 'Auto Maintenance', groupId: 'group2', sort_order: 1 },
          { id: 'cat7', name: 'Home Maintenance', groupId: 'group2', sort_order: 2 },
          { id: 'cat8', name: 'Medical', groupId: 'group2', sort_order: 3 },
          { id: 'cat9', name: 'Clothing', groupId: 'group2', sort_order: 4 },
          
          // Quality of Life
          { id: 'cat10', name: 'Dining Out', groupId: 'group3', sort_order: 1 },
          { id: 'cat11', name: 'Entertainment', groupId: 'group3', sort_order: 2 },
          { id: 'cat12', name: 'Subscriptions', groupId: 'group3', sort_order: 3 },
          
          // Savings Goals
          { id: 'cat13', name: 'Emergency Fund', groupId: 'group4', sort_order: 1, goal: { type: 'target', amount: 500000, due_date: '2023-12-31' } },
          { id: 'cat14', name: 'Vacation', groupId: 'group4', sort_order: 2, goal: { type: 'target', amount: 200000, due_date: '2023-08-15' } },
          { id: 'cat15', name: 'New Car', groupId: 'group4', sort_order: 3, goal: { type: 'monthly', amount: 25000 } },
          
          // Income
          { id: 'cat16', name: 'Salary', groupId: 'group5', sort_order: 1, is_income: true },
          { id: 'cat17', name: 'Bonus', groupId: 'group5', sort_order: 2, is_income: true },
          { id: 'cat18', name: 'Interest', groupId: 'group5', sort_order: 3, is_income: true },
        ];
        
        // Mock category stats
        const mockCategoryStats: CategoryStats[] = mockCategories.map(cat => {
          // Generate realistic stats based on category type
          const isIncome = mockCategoryGroups.find(g => g.id === cat.groupId)?.is_income || false;
          const baseAmount = isIncome ? 25000 : 15000;
          const multiplier = isIncome ? 10 : 1;
          
          return {
            categoryId: cat.id,
            totalSpent: Math.round((baseAmount + Math.random() * baseAmount * 5) * multiplier) * (isIncome ? 1 : -1),
            averageSpent: Math.round((baseAmount + Math.random() * baseAmount) * multiplier) * (isIncome ? 1 : -1),
            lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            transactionCount: Math.round(2 + Math.random() * 20)
          };
        });
        
        setCategoryGroups(mockCategoryGroups);
        setCategories(mockCategories);
        setCategoryStats(mockCategoryStats);
        
        // Initialize expanded groups state
        const initialExpandedState: {[key: string]: boolean} = {};
        mockCategoryGroups.forEach(group => {
          initialExpandedState[group.id] = true;
        });
        setExpandedGroups(initialExpandedState);
      } catch (error) {
        console.error('Error fetching category data:', error);
        toast.error('Failed to load category data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Add new category group
  const handleAddCategoryGroup = async () => {
    if (!newCategoryGroup.name) {
      toast.error('Please provide a name for the category group');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      const newId = `group${Date.now()}`;
      const nextSortOrder = Math.max(0, ...categoryGroups.map(g => g.sort_order)) + 1;
      
      const createdGroup: CategoryGroup = {
        id: newId,
        name: newCategoryGroup.name,
        is_income: newCategoryGroup.is_income || false,
        sort_order: nextSortOrder,
        hidden: newCategoryGroup.hidden || false
      };
      
      setCategoryGroups(prevGroups => [...prevGroups, createdGroup]);
      setNewCategoryGroup({
        is_income: false,
        sort_order: 0
      });
      setIsAddGroupDialogOpen(false);
      
      // Auto-expand the new group
      setExpandedGroups(prev => ({
        ...prev,
        [newId]: true
      }));
      
      toast.success('Category group created successfully');
    } catch (error) {
      console.error('Error creating category group:', error);
      toast.error('Failed to create category group');
    } finally {
      setIsLoading(false);
    }
  };

  // Update category group
  const handleUpdateCategoryGroup = async () => {
    if (!editingCategoryGroup) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      setCategoryGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === editingCategoryGroup.id ? editingCategoryGroup : group
        )
      );
      
      setIsEditGroupDialogOpen(false);
      toast.success('Category group updated successfully');
    } catch (error) {
      console.error('Error updating category group:', error);
      toast.error('Failed to update category group');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete category group
  const handleDeleteCategoryGroup = async () => {
    if (!editingCategoryGroup) return;
    
    setIsLoading(true);
    
    try {
      // Check if group has categories
      const groupCategories = categories.filter(cat => cat.groupId === editingCategoryGroup.id);
      
      if (groupCategories.length > 0) {
        // In a real app, you might want to offer to move these categories elsewhere
        toast.error(`Cannot delete group with ${groupCategories.length} categories. Move or delete categories first.`);
        setIsLoading(false);
        return;
      }
      
      // In a real app, this would be an API call
      setCategoryGroups(prevGroups => 
        prevGroups.filter(group => group.id !== editingCategoryGroup.id)
      );
      
      setIsDeleteGroupDialogOpen(false);
      setEditingCategoryGroup(null);
      toast.success('Category group deleted successfully');
    } catch (error) {
      console.error('Error deleting category group:', error);
      toast.error('Failed to delete category group');
    } finally {
      setIsLoading(false);
    }
  };

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.groupId) {
      toast.error('Please provide a name and group for the category');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      const newId = `cat${Date.now()}`;
      const groupCategories = categories.filter(cat => cat.groupId === newCategory.groupId);
      const nextSortOrder = groupCategories.length > 0 
        ? Math.max(...groupCategories.map(c => c.sort_order)) + 1 
        : 1;
      
      // Get if this is an income category from the group
      const group = categoryGroups.find(g => g.id === newCategory.groupId);
      const isIncome = group ? group.is_income : false;
      
      const createdCategory: Category = {
        id: newId,
        name: newCategory.name,
        groupId: newCategory.groupId,
        sort_order: nextSortOrder,
        hidden: newCategory.hidden || false,
        is_income: isIncome,
        notes: newCategory.notes,
        goal: newCategory.goal
      };
      
      setCategories(prevCategories => [...prevCategories, createdCategory]);
      setNewCategory({
        sort_order: 0,
        hidden: false
      });
      setIsAddCategoryDialogOpen(false);
      toast.success('Category created successfully');
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setIsLoading(false);
    }
  };

  // Update category
  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      setCategories(prevCategories => 
        prevCategories.map(category => 
          category.id === editingCategory.id ? editingCategory : category
        )
      );
      
      setIsEditCategoryDialogOpen(false);
      toast.success('Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async () => {
    if (!editingCategory) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      // You might want to check for transactions using this category first
      setCategories(prevCategories => 
        prevCategories.filter(category => category.id !== editingCategory.id)
      );
      
      setIsDeleteCategoryDialogOpen(false);
      setEditingCategory(null);
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setIsLoading(false);
    }
  };

  // Get category stats by ID
  const getCategoryStats = (categoryId: string): CategoryStats | undefined => {
    return categoryStats.find(stat => stat.categoryId === categoryId);
  };

  // Sorted groups
  const sortedGroups = [...categoryGroups].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Categories</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4 sm:mt-0">
          <Button 
            variant="outline" 
            onClick={() => setIsAddCategoryDialogOpen(true)}
          >
            <Tag className="mr-2 h-4 w-4" /> Add Category
          </Button>
          <Button 
            onClick={() => setIsAddGroupDialogOpen(true)}
          >
            <FolderPlus className="mr-2 h-4 w-4" /> Add Group
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Management</CardTitle>
          <CardDescription>
            Organize your spending and income into categories and groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">
              Loading categories...
            </div>
          ) : sortedGroups.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGroups.map(group => {
                    // Filter and sort categories for this group
                    const groupCategories = categories
                      .filter(category => category.groupId === group.id)
                      .sort((a, b) => a.sort_order - b.sort_order);
                    
                    const isExpanded = expandedGroups[group.id];
                    
                    return (
                      <React.Fragment key={group.id}>
                        {/* Group row */}
                        <TableRow className="bg-muted/30">
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => toggleGroupExpansion(group.id)}
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {group.name}
                            {group.hidden && <span className="ml-2 text-xs text-muted-foreground">(Hidden)</span>}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${group.is_income ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                              {group.is_income ? 'Income' : 'Expense'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {groupCategories.length} categories
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingCategoryGroup(group);
                                setIsEditGroupDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingCategoryGroup(group);
                                setIsDeleteGroupDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        
                        {/* Category rows */}
                        {isExpanded && groupCategories.map(category => {
                          const stats = getCategoryStats(category.id);
                          
                          return (
                            <TableRow key={category.id} className="hover:bg-muted/10">
                              <TableCell>
                                <div className="w-4 flex justify-center">
                                  <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                </div>
                              </TableCell>
                              <TableCell className="pl-8">
                                {category.name}
                                {category.hidden && <span className="ml-2 text-xs text-muted-foreground">(Hidden)</span>}
                                {category.goal && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Goal: {formatCurrency(category.goal.amount)} 
                                    {category.goal.type === 'monthly' ? ' monthly' : category.goal.due_date ? ` by ${category.goal.due_date}` : ''}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {category.is_income ? 'Income' : 'Expense'}
                              </TableCell>
                              <TableCell>
                                {stats ? (
                                  <div>
                                    <div className="text-sm">
                                      Total: <span className={stats.totalSpent < 0 ? 'text-destructive' : 'text-green-600'}>
                                        {formatCurrency(stats.totalSpent)}
                                      </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {stats.transactionCount} transactions, last used {new Date(stats.lastUsed).toLocaleDateString()}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">No usage data</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingCategory(category);
                                    setIsEditCategoryDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingCategory(category);
                                    setIsDeleteCategoryDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No categories found. Add your first category group to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Category Group Dialog */}
      <Dialog open={isAddGroupDialogOpen} onOpenChange={setIsAddGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category Group</DialogTitle>
            <DialogDescription>
              Create a new group to organize related categories.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="e.g., Housing, Transportation"
                value={newCategoryGroup.name || ''}
                onChange={e => setNewCategoryGroup({...newCategoryGroup, name: e.target.value})}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is-income"
                checked={newCategoryGroup.is_income}
                onCheckedChange={(checked) => 
                  setNewCategoryGroup({...newCategoryGroup, is_income: !!checked})
                }
              />
              <Label htmlFor="is-income">This is an income group</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is-hidden"
                checked={newCategoryGroup.hidden}
                onCheckedChange={(checked) => 
                  setNewCategoryGroup({...newCategoryGroup, hidden: !!checked})
                }
              />
              <Label htmlFor="is-hidden">Hide this group in reports and budgeting</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddGroupDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCategoryGroup} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Group Dialog */}
      <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category Group</DialogTitle>
            <DialogDescription>
              Update group information and settings.
            </DialogDescription>
          </DialogHeader>
          {editingCategoryGroup && (
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="edit-group-name">Group Name</Label>
                <Input
                  id="edit-group-name"
                  value={editingCategoryGroup.name}
                  onChange={e => setEditingCategoryGroup({...editingCategoryGroup, name: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-is-income"
                  checked={editingCategoryGroup.is_income}
                  onCheckedChange={(checked) => 
                    setEditingCategoryGroup({...editingCategoryGroup, is_income: !!checked})
                  }
                />
                <Label htmlFor="edit-is-income">This is an income group</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-is-hidden"
                  checked={editingCategoryGroup.hidden}
                  onCheckedChange={(checked) => 
                    setEditingCategoryGroup({...editingCategoryGroup, hidden: !!checked})
                  }
                />
                <Label htmlFor="edit-is-hidden">Hide this group in reports and budgeting</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditGroupDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCategoryGroup} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Group Dialog */}
      <Dialog open={isDeleteGroupDialogOpen} onOpenChange={setIsDeleteGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {editingCategoryGroup && (
            <div className="py-4">
              <p className="font-medium">{editingCategoryGroup.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {categories.filter(cat => cat.groupId === editingCategoryGroup.id).length} categories in this group
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteGroupDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCategoryGroup} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new spending or income category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                placeholder="e.g., Groceries, Salary"
                value={newCategory.name || ''}
                onChange={e => setNewCategory({...newCategory, name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="category-group">Group</Label>
              <Select
                value={newCategory.groupId}
                onValueChange={value => setNewCategory({...newCategory, groupId: value})}
              >
                <SelectTrigger id="category-group">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {sortedGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} {group.is_income ? '(Income)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category-notes">Notes (Optional)</Label>
              <Input
                id="category-notes"
                placeholder="Add any notes about this category"
                value={newCategory.notes || ''}
                onChange={e => setNewCategory({...newCategory, notes: e.target.value})}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="category-hidden"
                checked={newCategory.hidden}
                onCheckedChange={(checked) => 
                  setNewCategory({...newCategory, hidden: !!checked})
                }
              />
              <Label htmlFor="category-hidden">Hide this category in reports and budgeting</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCategory} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information and settings.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="edit-category-name">Category Name</Label>
                <Input
                  id="edit-category-name"
                  value={editingCategory.name}
                  onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-category-group">Group</Label>
                <Select
                  value={editingCategory.groupId}
                  onValueChange={value => setEditingCategory({...editingCategory, groupId: value})}
                >
                  <SelectTrigger id="edit-category-group">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedGroups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} {group.is_income ? '(Income)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-category-notes">Notes (Optional)</Label>
                <Input
                  id="edit-category-notes"
                  value={editingCategory.notes || ''}
                  onChange={e => setEditingCategory({...editingCategory, notes: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-category-hidden"
                  checked={editingCategory.hidden}
                  onCheckedChange={(checked) => 
                    setEditingCategory({...editingCategory, hidden: !!checked})
                  }
                />
                <Label htmlFor="edit-category-hidden">Hide this category in reports and budgeting</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCategory} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={isDeleteCategoryDialogOpen} onOpenChange={setIsDeleteCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="py-4">
              <p className="font-medium">{editingCategory.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                From group: {categoryGroups.find(g => g.id === editingCategory.groupId)?.name}
              </p>
              {getCategoryStats(editingCategory.id) && (
                <p className="text-sm text-muted-foreground mt-1">
                  Warning: This category has been used in {getCategoryStats(editingCategory.id)?.transactionCount} transactions.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteCategoryDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 