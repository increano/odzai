# Supabase Migration Roadmap

## Overview

This document outlines the step-by-step implementation plan for migrating the application to Supabase for authentication, role-based access control, and PostgreSQL database integration. The migration will be performed incrementally while maintaining existing functionality, adhering to UI freeze prevention guidelines, and preserving legacy Actual features.

## Migration Phases

### Phase 1: Supabase Setup and Authentication Integration (0% Complete)

| Task | Status | Notes |
|------|--------|-------|
| Create Supabase project with PostgreSQL database | ⬜️ Pending | Set up dedicated project for the application |
| Configure authentication settings | ⬜️ Pending | Email/password and social login options |
| Set up initial database schema | ⬜️ Pending | User tables with role fields and core entities |
| Implement Supabase Auth in Next.js | ⬜️ Pending | Using Supabase JS client for authentication |
| Create authentication wrapper components | ⬜️ Pending | For existing pages and routes |
| Implement session management | ⬜️ Pending | Replace current auth with Supabase sessions |
| Create user account synchronization layer | ⬜️ Pending | For gradual migration of user accounts |
| Develop one-way password reset flow | ⬜️ Pending | To securely migrate user credentials |

### Phase 2: Role-Based Access Control Implementation (0% Complete)

| Task | Status | Notes |
|------|--------|-------|
| Define role schema in Supabase | ⬜️ Pending | Admin, customer, and other needed roles |
| Configure Row Level Security policies | ⬜️ Pending | To enforce data access rules |
| Map existing permissions to new roles | ⬜️ Pending | Creating equivalence between systems |
| Create RequireAuth component | ⬜️ Pending | For authentication-protected routes |
| Create RequireRole component | ⬜️ Pending | For role-specific access control |
| Implement role-based route guards | ⬜️ Pending | Protecting admin and user-specific pages |
| Update sidebar with role-specific items | ⬜️ Pending | Show/hide based on user role |
| Move admin features behind role checks | ⬜️ Pending | Like conflict resolution functionality |
| Create dedicated admin section | ⬜️ Pending | With proper role-based permissions |

### Phase 3: Incremental Data Migration (0% Complete)

| Task | Status | Notes |
|------|--------|-------|
| Analyze SQLite schema | ⬜️ Pending | Document all tables, indexes, and relationships |
| Create equivalent PostgreSQL schema | ⬜️ Pending | Optimized for PostgreSQL capabilities |
| Set up foreign key relationships | ⬜️ Pending | And appropriate indexes for performance |
| Create migration scripts per table | ⬜️ Pending | For data transfer between systems |
| Implement feature flag system | ⬜️ Pending | To toggle between data sources |
| Set up read-only PostgreSQL connection | ⬜️ Pending | For initial testing with real data |
| Develop chunked data transfer utilities | ⬜️ Pending | Using requestAnimationFrame for UI responsiveness |
| Create migration progress indicators | ⬜️ Pending | For user feedback during long transfers |
| Implement scheduled off-peak migrations | ⬜️ Pending | To minimize user impact |

### Phase 4: Dual-Write System and Completion (0% Complete)

| Task | Status | Notes |
|------|--------|-------|
| Implement transaction system | ⬜️ Pending | For writing to both databases |
| Create fallback mechanisms | ⬜️ Pending | In case one system fails |
| Develop conflict detection and resolution | ⬜️ Pending | For data inconsistencies |
| Implement feature flags per feature | ⬜️ Pending | To control data source granularly |
| Migrate individual features incrementally | ⬜️ Pending | One at a time with thorough testing |
| Add performance tracking | ⬜️ Pending | To compare operation speeds |
| Optimize queries for PostgreSQL | ⬜️ Pending | Leveraging PostgreSQL-specific features |
| Create database adapter interfaces | ⬜️ Pending | For consistent API across both systems |
| Develop compatibility layers | ⬜️ Pending | For Actual-specific features |

## Technical Implementation Specifications

### Authentication Provider Implementation

```jsx
// Supabase authentication provider component
export function SupabaseAuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set up supabase auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )
    
    // Clean up listener
    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Role-Based Access Control Components

```jsx
// Role-based access control component
export function RequireRole({ children, allowedRoles }) {
  const { user, userRoles, loading } = useAuth()
  
  // Show loading state while checking authentication
  if (loading) {
    return <div>Loading...</div>
  }
  
  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  // Check if user has any of the allowed roles
  const hasAllowedRole = allowedRoles.some(role => userRoles.includes(role))
  
  // Redirect if not authorized
  if (!hasAllowedRole) {
    return <Navigate to="/unauthorized" replace />
  }
  
  return <>{children}</>
}
```

### Data Migration Worker

```javascript
// Worker script for database migration
self.addEventListener('message', async (e) => {
  const { chunk, tableName } = e.data;
  
  try {
    // Process each record in the chunk
    const results = await Promise.all(chunk.map(async (record) => {
      // Transform SQLite record to PostgreSQL format
      const transformed = transformRecord(record, tableName);
      // Insert into Supabase
      const { data, error } = await supabase
        .from(tableName)
        .upsert(transformed);
        
      return { success: !error, record, error };
    }));
    
    // Report progress back to main thread
    self.postMessage({ 
      type: 'progress', 
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
});
```

### Database Adapter Pattern

```typescript
// Database adapter interface
interface DatabaseAdapter {
  getTransactions(accountId?: string): Promise<Transaction[]>;
  createTransaction(transaction: TransactionInput): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<TransactionInput>): Promise<Transaction>;
  deleteTransaction(id: string): Promise<boolean>;
  // Additional methods for other entities
}

// SQLite adapter implementation
class SQLiteAdapter implements DatabaseAdapter {
  // Implementation of database methods using SQLite
}

// Supabase/PostgreSQL adapter implementation
class SupabaseAdapter implements DatabaseAdapter {
  // Implementation of database methods using Supabase
}

// Factory function to get the appropriate adapter
function getDatabaseAdapter(options: { useSupabase: boolean }): DatabaseAdapter {
  if (options.useSupabase) {
    return new SupabaseAdapter();
  }
  return new SQLiteAdapter();
}
```

## UI Freeze Prevention Techniques

To maintain UI responsiveness during this migration, the following techniques will be employed:

1. **Chunked Processing**
   - Split large data operations into small chunks
   - Process chunks with requestAnimationFrame to yield to UI thread
   - Implement pause/resume capabilities for long-running operations

2. **Optimistic UI Updates**
   - Update UI immediately before database operations complete
   - Implement rollback mechanisms for failed operations
   - Use local state management for immediate feedback

3. **Background Operations**
   - Use Web Workers for CPU-intensive tasks
   - Schedule data migrations during idle periods
   - Implement progress indicators for long-running processes

4. **Staged Transitions**
   - Complete UI animations before starting data operations
   - Use setTimeout to schedule operations after animations
   - Implement loading states during transitions

## Overall Completion

| Phase | Description | Status | Progress |
|-------|-------------|--------|----------|
| Phase 1 | Supabase Setup and Authentication | Not Started | 0% |
| Phase 2 | Role-Based Access Control | Not Started | 0% |
| Phase 3 | Incremental Data Migration | Not Started | 0% |
| Phase 4 | Dual-Write System and Completion | Not Started | 0% |
| **OVERALL** | **Project Completion** | **Not Started** | **0%** |

## Success Criteria

The migration will be considered successful when:

1. All users have been migrated to Supabase authentication
2. Role-based access control is fully implemented
3. All data has been migrated to PostgreSQL
4. Application performance is equal to or better than with SQLite
5. All legacy features continue to function as expected
6. No UI freezes occur during normal operation 