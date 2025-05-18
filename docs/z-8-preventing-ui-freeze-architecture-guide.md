# Preventing UI Freezes in Next.js Applications

## Root Causes of Unresponsive UI After Dialog Closes

When modals or dialogs become unresponsive in React/Next.js applications, these are typically the underlying causes:

1. **Multiple Competing Asynchronous Operations**
   - Running multiple `router.refresh()` calls too close together
   - API calls, state updates, and UI animations competing for resources
   - Promise chains overlapping and blocking each other

2. **Heavy Operations on the Main Thread**
   - Expensive re-renders during animation transitions
   - Complex DOM updates while the modal is animating
   - Large state updates triggering cascading component re-renders

3. **Poor Timing of Operations**
   - Refreshing the page before animations complete
   - Navigation occurring during modal closing transitions
   - Multiple state updates causing repeated renders

4. **Resource Contention**
   - LocalStorage operations blocking the UI thread
   - Multiple data fetches occurring simultaneously
   - Redundant state updates causing unnecessary work

## Architecture Improvements to Maintain UI Responsiveness

### 1. Modal and Dialog Best Practices

- **Separate Closing from Data Operations**
  ```javascript
  // ❌ Bad: Combining closing and data operations
  const handleClose = () => {
    onOpenChange(false);
    router.refresh();
    updateLocalStorage();
    refetchData();
  };
  
  // ✅ Good: Separate closing from data operations
  const handleClose = () => {
    // First just update UI state
    onOpenChange(false);
    
    // Schedule data operations AFTER animations (typically 300ms)
    setTimeout(() => {
      updateDataAsNeeded();
    }, 300);
  };
  ```

- **Implement Loading States During Transitions**
  ```jsx
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const handleAction = async () => {
    setIsTransitioning(true);
    try {
      await performOperation();
      onOpenChange(false);
    } finally {
      // Reset transitioning state after a delay
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };
  
  // Disable buttons during transitions
  <Button disabled={isTransitioning}>Save</Button>
  ```

- **Avoid Modal-Closing Side Effects**
  - Buttons within modals should perform their primary function only
  - Setting default workspaces, updating preferences, etc. should not automatically close modals
  - Allow users to see the result of their action before the modal closes

### 2. State Management Improvements

- **Batch State Updates**
  ```javascript
  // ❌ Bad: Multiple individual state updates
  setName(newName);
  setEmail(newEmail);
  setPreferences(newPrefs);
  
  // ✅ Good: Batch updates with useReducer or a single setState
  setUserData(prevData => ({
    ...prevData,
    name: newName,
    email: newEmail,
    preferences: newPrefs
  }));
  ```

- **Use Optimistic UI Updates**
  ```javascript
  // Update local state immediately for responsive UI
  setWorkspaceName(newName);
  
  // Then perform the actual API update
  try {
    await updateWorkspaceNameApi(newName);
  } catch (error) {
    // Revert optimistic update on error
    setWorkspaceName(originalName);
    showError(error);
  }
  ```

- **Implement Data Fetching Libraries**
  - Replace manual fetch + state management with React Query or SWR
  - These libraries handle caching, background refreshes, and optimistic updates
  - Example:
    ```javascript
    // Instead of manual fetching and state management
    const { data, isLoading, error, mutate } = useSWR(
      `/api/workspaces/${id}`,
      fetcher
    );
    
    // Update data optimistically
    mutate(updatedData, false); // false means don't revalidate immediately
    ```

### 3. Asynchronous Operation Handling

- **Prioritize Visual Feedback**
  - Critical UI updates should happen immediately
  - Defer non-essential updates until after animations complete
  - Use visual feedback (spinners, progress indicators) for longer operations

- **Properly Structure Async Operations**
  ```javascript
  // ❌ Bad: Complex nested promises
  Promise.resolve()
    .then(() => {
      return someOperation()
        .then(() => anotherOperation())
        .then(() => finalOperation());
    })
    .catch(error => handleError(error));
  
  // ✅ Good: Async/await with clear error handling
  async function performOperations() {
    try {
      await someOperation();
      await anotherOperation();
      await finalOperation();
    } catch (error) {
      handleError(error);
    }
  }
  ```

- **Cancel Unnecessary Operations**
  - Use AbortController for fetch operations
  - Implement cleanup functions in useEffect
  - Avoid updates on unmounted components

### 4. Navigation and Refresh Strategies

- **Avoid Immediate Navigation After Modal Close**
  ```javascript
  // ❌ Bad: Immediate navigation
  onOpenChange(false);
  router.push('/newRoute');
  
  // ✅ Good: Delayed navigation
  onOpenChange(false);
  setTimeout(() => {
    router.push('/newRoute');
  }, 300); // Allow time for close animation to complete
  ```

- **Choose Selective Refresh Over Full Page Refresh**
  - Instead of refreshing the entire page, refresh specific components
  - Use React Query's `invalidateQueries` or SWR's `mutate` to refresh specific data
  - Consider using server components for selective hydration in Next.js 13+

- **Implement Staged Updates**
  ```javascript
  const handleSave = async () => {
    // 1. Update local state immediately (UI appears responsive)
    setLocalState(newValue);
    
    // 2. Close modal
    onOpenChange(false);
    
    // 3. Schedule API update after animation
    setTimeout(async () => {
      try {
        await updateApiData(newValue);
        // 4. Optional: Refresh data as needed
        await refreshData();
      } catch (error) {
        showError(error);
      }
    }, 300);
  };
  ```

### 5. Performance Considerations

- **Debounce or Throttle Expensive Operations**
  ```javascript
  // Use debounce for operations like search
  const debouncedSearch = debounce((term) => {
    performSearch(term);
  }, 300);
  
  // Use throttle for operations like refresh
  const throttledRefresh = throttle(() => {
    router.refresh();
  }, 500);
  ```

- **Avoid Direct DOM Manipulation During Transitions**
  - Don't manipulate localStorage during modal animations
  - Defer non-critical calculations until after transitions
  - Use `requestAnimationFrame` for animations that must occur during transitions

- **Implement Web Workers for CPU-Intensive Tasks**
  - Move heavy calculations off the main thread
  - Consider using web workers for data processing, calculations, etc.
  - Example: parsing large CSV files, complex filtering operations

### 6. Testing and Monitoring

- **Test Modal Interactions Specifically**
  - Add tests for modal open/close transitions
  - Verify state after modal closures
  - Test rapid interactions (multiple opens/closes)

- **Monitor UI Performance**
  - Use Performance API to track metrics
  - Implement error boundary components
  - Look for recurring issues in production logs

## Conclusion

By implementing these architecture improvements, we can maintain UI responsiveness even during complex operations like closing modals and updating state. Always prioritize the user experience by ensuring that visual feedback is immediate, while deferring heavy operations until after transitions complete.

Remember the key principles:
1. Separate visual updates from data operations
2. Schedule operations with appropriate timing
3. Batch state updates to reduce renders
4. Use proper async/await patterns with error handling
5. Implement loading states during transitions

Following these guidelines will help prevent the unresponsive UI issues we've encountered, especially in modal interactions and post-close operations. 