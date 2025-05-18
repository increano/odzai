import { useReducer, useCallback, Reducer, Dispatch } from 'react';

/**
 * Action type with mandatory type field and optional payload
 */
export interface Action<T = string, P = any> {
  type: T;
  payload?: P;
}

/**
 * Generic reducer state hook with typed actions and state
 * Provides memoized action creators for better performance
 */
export function useReducerState<S, A extends Action = Action>(
  reducer: Reducer<S, A>,
  initialState: S,
  actionCreators: Record<string, (...args: any[]) => A>
): [S, Record<string, (...args: any[]) => void>, Dispatch<A>] {
  // Initialize the reducer
  const [state, dispatch] = useReducer<Reducer<S, A>>(reducer, initialState);
  
  // Create memoized versions of each action creator that automatically dispatch
  const boundActionCreators = Object.entries(actionCreators).reduce(
    (acc, [actionName, actionCreator]) => {
      // Create a memoized function that calls actionCreator and dispatches the result
      acc[actionName] = useCallback(
        (...args: any[]) => {
          const action = actionCreator(...args);
          dispatch(action);
        },
        [dispatch, actionCreator]
      );
      return acc;
    },
    {} as Record<string, (...args: any[]) => void>
  );
  
  return [state, boundActionCreators, dispatch];
}

/**
 * Helper to create a reducer function with a map of handler functions
 * This helps avoid large switch statements
 */
export function createReducer<S, A extends Action>(
  handlers: Record<string, (state: S, action: A) => S>,
  initialState: S
): [Reducer<S, A>, S] {
  const reducer: Reducer<S, A> = (state, action) => {
    const handler = handlers[action.type];
    if (handler) {
      return handler(state, action);
    }
    return state;
  };
  
  return [reducer, initialState];
}

/**
 * Helper to create bound action creators
 */
export function createActionCreators<A extends Action>(
  actionMap: Record<string, (...args: any[]) => A>
): Record<string, (...args: any[]) => A> {
  return actionMap;
} 