import { HostRoot } from './ReactWorkTags';
import { NoFlags } from './ReactFiberFlags';
import { IndeterminateComponent, HostComponent, HostText } from './ReactWorkTags';
/**
 * 构造函数，用于创建一个新的Fiber节点
 * @param {number} tag - fiber的类型，如函数组件、类组件、原生组件、根元素等
 * @param {*} pendingProps - 新属性，等待处理或者说生效的属性
 * @param {*} key - 唯一标识
 */
export function FiberNode(tag, pendingProps, key) {
  // 标识 Fiber 节点的类型，如函数组件、类组件、原生组件等
  this.tag = tag;
  // React 元素的 key 属性，用于优化更新过程中的 diff 操作
  this.key = key;
  // React 元素的类型，如 div、span、组件函数等
  this.type = null;

  // 指向该 Fiber 节点对应的真实 DOM 节点或者类组件实例
  this.stateNode = null;
  // 指向父级 Fiber 节点
  this.return = null;
  this.child = null;
  // 指向下一个兄弟 Fiber 节点
  this.sibling = null;
  // 即将更新的 props
  this.pendingProps = pendingProps;
  // 当前 Fiber 节点上已经生效的 props
  this.memoizedProps = null;
  // 当前 Fiber 节点上的状态
  this.memoizedState = null;
  // 存储该 Fiber 节点的更新队列
  this.updateQueue = null;
  // 标识该 Fiber 节点在更新过程中需要进行的操作（如：更新、删除、插入等）
  this.flags = NoFlags;
  // 子树中所有 Fiber 节点的 flags 的合集
  this.subtreeFlags = NoFlags;
  // 指向该 Fiber 节点在上一次更新时对应的 Fiber 节点
  this.alternate = null;
  // 当前节点在兄弟节点中的索引位置
  this.index = 0;
  // 需要删除的子节点
  this.deletions = null;
}

/**
 * 用于创建新的Fiber节点
 * @param {number} tag - fiber的类型
 * @param {*} pendingProps - 新属性
 * @param {*} key - 唯一标识
 * @returns {FiberNode} 新的Fiber节点
 */
export function createFiber(tag, pendingProps, key) {
  return new FiberNode(tag, pendingProps, key);
}

/**
 * 创建新的HostRoot类型的Fiber节点
 * @returns {FiberNode} 新的HostRoot类型的Fiber节点
 */
export function createHostRootFiber() {
  return createFiber(HostRoot, null, null);
}

/**
 * 基于旧的Fiber节点和新的属性创建一个新的Fiber节点
 * @param {FiberNode} current - 旧的Fiber节点
 * @param {*} pendingProps - 新的属性
 * @returns {FiberNode} 新的Fiber节点
 */
export function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.type = current.type;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
  }
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;

  return workInProgress;
}

/**
 * 从虚拟DOM创建新的Fiber节点
 * @param {*} element - 虚拟DOM元素
 * @returns {FiberNode} 新的Fiber节点
 */
export function createFiberFromElement(element) {
  const { type, key, props: pendingProps } = element;
  return createFiberFromTypeAndProps(type, key, pendingProps);
}

/**
 * 从类型和属性创建新的Fiber节点
 * @param {*} type - Fiber节点的类型
 * @param {*} key - 唯一标识
 * @param {*} pendingProps - 新的属性
 * @returns {FiberNode} 新的Fiber节点
 */
function createFiberFromTypeAndProps(type, key, pendingProps) {
  let tag = IndeterminateComponent;
  if (typeof type === 'string') {
    tag = HostComponent;
  }
  const fiber = createFiber(tag, pendingProps, key);
  fiber.type = type;
  return fiber;
}

/**
 * 创建一个新的文本类型的Fiber节点
 * @param {*} content - 文本内容
 * @returns {FiberNode} 新的文本类型的Fiber节点
 */
export function createFiberFromText(content) {
  return createFiber(HostText, content, null);
}
