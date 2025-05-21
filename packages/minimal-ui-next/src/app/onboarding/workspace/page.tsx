'use client';

import { useState, useEffect } from 'react';
import { StepLayout } from '../../../components/onboarding/StepLayout';
import { useOnboarding } from '../../../components/providers/OnboardingProvider';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../../components/providers/SupabaseAuthProvider';

function WorkspaceContent() {
  const { workspaceName, setWorkspaceName, goToNextStep, goToStep } = useOnboarding();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#3B82F6'); // Default blue color
  const [error, setError] = useState('');
  const { session } = useAuth();

  useEffect(() => {
    // Ensure we're on the correct step when this component mounts
    goToStep('workspace');
  }, [goToStep]);

  const isFormValid = workspaceName.trim().length > 0;

  const handleCreateWorkspace = async () => {
    if (!isFormValid) return;
    
    try {
      setIsCreating(true);
      setError('');
      
      // We'll continue even without a session during onboarding
      // This way new users can create their first workspace
      
      // For onboarding, let's try the fallback approach of creating a workspace directly
      // First, try to generate a unique ID for the workspace
      const workspaceId = `${workspaceName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Use POST request to create workspace via API endpoint
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: workspaceId,
          name: workspaceName.trim(),
          color: selectedColor
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create workspace (${response.status})`);
      }
      
      const data = await response.json();
      
      if (!data) {
        throw new Error('Failed to create workspace');
      }
      
      toast.success(`Workspace "${workspaceName}" created successfully`);
      
      // Move to next step
      goToNextStep();
    } catch (err: any) {
      console.error('Error creating workspace:', err);
      setError(err.message || 'Failed to create workspace');
      toast.error('Failed to create workspace');
    } finally {
      setIsCreating(false);
    }
  };

  const colors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', 
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
    '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
  ];

  return (
    <StepLayout
      title="Create Your Workspace"
      description="A workspace is where all your budgets and financial data will be stored"
      currentStep="workspace"
      nextButtonDisabled={!isFormValid || isCreating}
      nextButtonText={isCreating ? 'Creating...' : 'Create Workspace'}
      onNextButtonClick={handleCreateWorkspace}
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-3">
          <Label htmlFor="workspace-name">Workspace Name</Label>
          <Input 
            id="workspace-name"
            placeholder="My Budget"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            disabled={isCreating}
          />
          <p className="text-sm text-gray-500">
            Give your workspace a descriptive name like "Family Budget" or "Personal Finances"
          </p>
        </div>
        
        <div className="space-y-3">
          <Label>Workspace Color</Label>
          <div className="py-2 flex flex-wrap gap-2">
            {colors.map((color) => (
              <div
                key={color}
                className={`w-8 h-8 rounded-full cursor-pointer ${
                  selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500">
            Choose a color to help identify this workspace
          </p>
        </div>
      </div>
    </StepLayout>
  );
}

export default function WorkspacePage() {
  return <WorkspaceContent />;
} 