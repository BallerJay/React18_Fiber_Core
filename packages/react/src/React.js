import { useReducer } from './ReactHooks';
import ReactSharedInternals from './ReactSharedInternals';

export {
  useReducer,
  // __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: React内部对象，不应在应用代码中直接使用，名称表明这是私有API，使用可能导致应用崩溃
  ReactSharedInternals as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
};
