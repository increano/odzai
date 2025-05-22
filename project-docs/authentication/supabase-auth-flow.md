# Supabase Authentication Flow

## Overview
This document describes the authentication flow using Supabase in our Next.js application.

## Authentication Flow

### Sign Up Flow
1. User fills out the signup form
2. Form submits to Supabase Auth
3. Supabase sends confirmation email
4. User clicks confirmation link
5. Redirected to `/auth/callback`
6. Callback route:
   - Exchanges code for session
   - Creates user preferences
   - Redirects to onboarding or budget page

### Login Flow
1. User submits login credentials
2. Supabase validates credentials
3. On success:
   - Session is created
   - Preferences are checked
   - User is redirected based on onboarding status

### Session Management
- Sessions are handled by Supabase client
- No middleware required
- Server Components use `createServerComponentClient`
- Client Components use `createClientComponentClient`

## Code Examples

### Login Form
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

### Auth Callback
```typescript
const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
```

### Session Check
```typescript
const { data: { user }, error } = await supabase.auth.getUser();
```

## Important Routes

- `/login` - Login page
- `/signup` - Signup page
- `/auth/callback` - Auth callback handler
- `/onboarding/welcome` - First onboarding page
- `/budget` - Main application page

## Security Considerations

1. Always use `getUser()` for server-side auth checks
2. Never trust client-side session data for critical operations
3. Always verify session server-side before accessing protected data
4. Use proper CORS and CSP headers
5. Implement rate limiting for auth endpoints

## Error Handling

Common error scenarios and how to handle them:
1. Invalid credentials
2. Expired session
3. Missing confirmation
4. Network issues
5. Database errors

## Best Practices

1. Use Server Components for initial auth checks
2. Keep auth state in context
3. Handle loading states appropriately
4. Provide clear error messages
5. Implement proper redirect flows 