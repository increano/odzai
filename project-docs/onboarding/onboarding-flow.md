# Onboarding Flow

## Overview
This document describes the onboarding process for new users in our application.

## Onboarding Steps

1. Welcome Page (`/onboarding/welcome`)
   - Initial welcome message
   - Overview of the setup process
   - Next step: Workspace setup

2. Workspace Setup (`/onboarding/workspace`)
   - Create first workspace
   - Set workspace name
   - Set workspace preferences
   - Store as default workspace

3. Profile Setup (`/onboarding/profile`)
   - Set user's full name
   - Additional profile preferences
   - Complete onboarding process

## Data Structure

### User Preferences
```typescript
interface UserPreferences {
  user_id: string;
  default_workspace_id?: string;
  theme: 'light' | 'dark';
  data: {
    onboarding: {
      completed: boolean;
      currentStep: 'welcome' | 'workspace' | 'profile' | 'complete';
      completedAt?: string;
    };
    profile?: {
      fullName: string;
      updatedAt: string;
    };
  };
}
```

### Workspace Data
```typescript
interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  color: string;
  created_at: string;
  updated_at: string;
}
```

## Component Structure

### Layout
- `OnboardingProvider` - Context for onboarding state
- `OnboardingLayout` - Common layout for all onboarding pages
- Step-specific components for each page

### Navigation
- Linear progression through steps
- Can't skip steps
- Can go back to previous steps
- Automatic redirect on completion

## State Management

1. Initial State
```typescript
{
  currentStep: 'welcome',
  completed: false
}
```

2. Progress Tracking
- Each step updates preferences in Supabase
- Progress is persisted between sessions
- Automatic redirect to last incomplete step

## Security

1. Route Protection
- All onboarding routes require authentication
- Server-side session validation
- Proper error handling for unauthorized access

2. Data Validation
- Input validation on all forms
- Server-side validation of all data
- Proper error handling for invalid data

## Error Handling

1. Common Errors
- Session expired
- Network issues
- Invalid input
- Database errors

2. Error Recovery
- Clear error messages
- Retry mechanisms
- Graceful fallbacks

## Best Practices

1. User Experience
- Clear progress indication
- Helpful instructions
- Smooth transitions
- Loading states

2. Data Management
- Persist progress frequently
- Validate all inputs
- Handle errors gracefully
- Clear success feedback

3. Performance
- Optimize loading times
- Minimize database calls
- Efficient state management
- Proper caching

## Testing

1. Key Test Cases
- Complete flow
- Individual steps
- Error scenarios
- Edge cases

2. User Scenarios
- New user signup
- Session expiry
- Network issues
- Invalid inputs 