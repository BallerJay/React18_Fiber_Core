import ReactCurrentDispatcher from './ReactCurrentDispatcher';

function resolveDispatcher() {
  return ReactCurrentDispatcher.current;
}

export function useReducer(reducer, initialState) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialState);
}
