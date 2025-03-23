import ReactSharedInternals from 'shared/ReactSharedInternals';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
import { enqueueConcurrentHookUpdate } from './ReactFiberConcurrentUpdates';

const { ReactCurrentDispatcher } = ReactSharedInternals;
// 当前正在渲染的 fiber
let currentlyRenderingFiber = null;
// 当前正在构建的 hook 对象，指向 workInProgress fiber 上的 hook 链表中最新的 hook
// - workInProgressHook 指向新 fiber（workInProgress）上的 hook 链表
// - currentHook 指向老 fiber（current）上对应的 hook
// 在组件更新过程中，会基于 currentHook 创建对应的 workInProgressHook
let workInProgressHook = null;
// 当前正在渲染的 hook
let currentHook = null;
// 挂载时的 hooks 分发器
const HooksDispatcherOnMount = {
  useReducer: mountReducer,
};
// 更新时的 hooks 分发器
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
};

function mountReducer(reducer, initialState) {
  // 创建一个新的 hook 并添加到 fiber 的 hook 链表中
  const hook = mountWorkInProgressHook();
  // 将初始状态保存到 hook 的 memoizedState 属性中
  hook.memoizedState = initialState;
  // 创建更新队列对象，pending 属性初始为 null，用于后续存储更新
  const queue = {
    pending: null,
  };
  // 将更新队列关联到当前 hook
  hook.queue = queue;
  // 创建 dispatch 函数，绑定当前 fiber 和更新队列，用于触发状态更新
  const dispatch = (queue.dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  // 返回当前状态和 dispatch 函数的数组，与 React 的 useReducer API 一致
  return [hook.memoizedState, dispatch];
}

function updateReducer(reducer) {
  // 获取当前正在处理的 hook
  const hook = updateWorkInProgressHook();
  // 获取当前 hook 的更新队列
  const queue = hook.queue;
  // 获取当前 hook 对应的上一次渲染的 hook
  const current = currentHook;
  // 获取待处理的更新队列
  const pendingQueue = queue.pending;
  // 初始化新状态为上一次渲染的状态
  let newState = current.memoizedState;

  // 如果有待处理的更新
  if (pendingQueue !== null) {
    // 清空待处理队列，防止重复处理
    queue.pending = null;
    // 获取更新队列中的第一个更新
    const firstUpdate = pendingQueue.next;
    // 当前处理的更新
    let update = firstUpdate;
    // 循环处理所有更新
    do {
      // 获取当前更新的 action
      const action = update.action;
      // 使用 reducer 根据当前状态和 action 计算新状态
      newState = reducer(newState, action);
      // 移动到下一个更新
      update = update.next;
      // 继续循环直到处理完所有更新（循环链表回到起点或为空）
    } while (update !== null && update !== firstUpdate);
  }

  // 将计算出的新状态保存到当前 hook 中
  hook.memoizedState = newState;

  // 返回最新状态和 dispatch 函数，与 React 的 useReducer API 一致
  return [hook.memoizedState, queue.dispatch];
}

function dispatchReducerAction(fiber, queue, action) {
  // #TODO: 需要实现 2025-03-04
  const update = {
    action,
    next: null,
  };
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root, fiber);
}

function mountWorkInProgressHook() {
  // 创建一个新的 hook 对象，包含三个属性
  // memoizedState: 用于存储 hook 的状态
  // queue: 用于存储更新队列
  // next: 指向下一个 hook，形成链表结构
  const hook = {
    memoizedState: null,
    queue: null,
    next: null,
  };

  // 如果当前没有工作中的 hook，说明这是 fiber 的第一个 hook
  if (workInProgressHook === null) {
    // 将 fiber 的 memoizedState 指向这个 hook，同时更新 workInProgressHook
    // 这样就建立了 fiber 和 hook 链表的起点连接
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 如果已经有 hook 存在，将新 hook 添加到链表末尾
    // 同时更新 workInProgressHook 指向新添加的 hook
    workInProgressHook = workInProgressHook.next = hook;
  }

  // 返回当前工作中的 hook
  return workInProgressHook;
}

function updateWorkInProgressHook() {
  // 如果当前没有处理中的 hook，说明这是更新过程中的第一个 hook
  if (currentHook === null) {
    // 获取当前 fiber 的备份（alternate）
    const current = currentlyRenderingFiber.alternate;
    // 将 currentHook 指向备份 fiber 的第一个 hook
    currentHook = current.memoizedState;
  } else {
    // 如果已经有处理中的 hook，移动到链表中的下一个 hook
    currentHook = currentHook.next;
  }

  // 创建一个新的 hook 对象，复制当前 hook 的状态和队列
  const newHook = {
    memoizedState: currentHook.memoizedState, // 复制记忆状态
    queue: currentHook.queue, // 复制更新队列
    next: null, // 初始化 next 为 null
  };

  // 如果工作中的 hook 链表为空，说明这是第一个 hook
  if (workInProgressHook === null) {
    // 将 fiber 的 memoizedState 和 workInProgressHook 都指向新创建的 hook
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
  } else {
    // 如果已经有 hook 存在，将新 hook 添加到链表末尾
    // 同时更新 workInProgressHook 指向新添加的 hook
    workInProgressHook = workInProgressHook.next = newHook;
  }

  // 返回当前工作中的 hook
  return workInProgressHook;
}
/**
 * 在函数组件中渲染组件
 * @param {FiberNode} current - 老的Fiber节点
 * @param {FiberNode} workInProgress - 新的Fiber节点
 * @param {Function} Component - 组件
 * @param {*} props - 新的props
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  currentlyRenderingFiber = workInProgress;
  if (current !== null && current.memoizedState !== null) {
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    ReactCurrentDispatcher.current = HooksDispatcherOnMount;
  }
  const children = Component(props);
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
  return children;
}
