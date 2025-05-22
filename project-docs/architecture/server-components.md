# Server Components Architecture

## Overview
This document outlines how we use React Server Components (RSC) in our Next.js application.

## Key Concepts

### Server Components
- Default in Next.js 14 App Router
- Run only on the server
- Reduce client-side JavaScript
- Direct database access
- Better performance and SEO

### Client Components
- Marked with 'use client'
- Interactive features
- Client-side state
- Event handlers
- Browser APIs

## Component Types

### 1. Server Components
```typescript
// app/page.tsx
export default async function Page() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  
  return <div>Welcome {user.email}</div>;
}
```

### 2. Client Components
```typescript
'use client';

export function InteractiveComponent() {
  const [state, setState] = useState();
  
  return <button onClick={() => setState()}>Click me</button>;
}
```

## Data Fetching

### Server Components
```typescript
// Direct database access
const { data } = await supabase
  .from('table')
  .select('*');
```

### Client Components
```typescript
'use client';

// Use hooks or fetch
const { data } = useSWR('/api/data', fetcher);
```

## File Organization

```
app/
├── layout.tsx           # Root layout (server)
├── page.tsx            # Root page (server)
├── components/
│   ├── server/         # Server Components
│   └── client/         # Client Components
└── lib/
    ├── server/         # Server-only code
    └── client/         # Client-side code
```

## Best Practices

### 1. Component Split
- Keep server components as parents
- Push client components to leaves
- Minimize client-side JavaScript

### 2. Data Fetching
- Prefer server components
- Use streaming for slow data
- Implement proper loading states

### 3. State Management
- Server: Database/Redis
- Client: React state/Context
- Hybrid: Server actions

## Performance Optimization

### Server Components
- Automatic code splitting
- No client-side JavaScript
- Cached rendering
- Streaming responses

### Client Components
- Selective hydration
- Progressive enhancement
- Minimized bundle size

## Security Considerations

### Server Components
- Safe database access
- Protected environment variables
- Server-side validation

### Client Components
- Limited API exposure
- Protected routes
- Sanitized data

## Error Handling

### Server Errors
```typescript
// error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Client Errors
- Error boundaries
- Fallback UI
- Retry mechanisms

## Testing

### Server Components
- Unit tests
- Integration tests
- API tests

### Client Components
- React Testing Library
- User event testing
- Mock service worker

## Deployment

### Build Process
- Automatic optimization
- Edge runtime support
- Static/dynamic rendering

### Monitoring
- Server metrics
- Client performance
- Error tracking 