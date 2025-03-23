import { HostComponent, HostRoot, HostText, FunctionComponent } from './ReactWorkTags';
import { NoFlags, Update } from './ReactFiberFlags';
import {
  createTextInstance,
  createInstance,
  appendInitialChild,
  finalizeInitialChildren,
  prepareUpdate,
} from 'react-dom-bindings/src/client/ReactDOMHostConfig';

/**
 * 为完成的fiber节点的父DOM节点添加所有子DOM节点
 * @param {DOM} parent - 完成的fiber节点对应的真实DOM节点
 * @param {Fiber} workInProgress - 已完成的Fiber节点
 */
function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child;
  while (node) {
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      node = node.child;
      continue;
    }
    if (node === workInProgress) {
      return;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    node = node.sibling;
  }
}

/**
 * 标记更新
 * @param {Fiber} workInProgress - 当前工作中的Fiber节点
 */
function markUpdate(workInProgress) {
  workInProgress.flags |= Update;
}

function updateHostComponent(current, workInProgress, type, newProps) {
  // 获取旧的属性
  const oldProps = current.memoizedProps;
  // 获取DOM实例
  const instance = workInProgress.stateNode;
  // 准备更新负载，比较新旧属性的差异
  const updatePayload = prepareUpdate(instance, type, oldProps, newProps);
  // 将更新负载存储在fiber的updateQueue中
  workInProgress.updateQueue = updatePayload;
  // 如果有需要更新的属性，标记此fiber需要进行DOM更新
  if (updatePayload) {
    markUpdate(workInProgress);
  }
}
/**
 * 完成一个Fiber节点
 * @param {Fiber} current - 当前旧的Fiber节点
 * @param {Fiber} workInProgress - 新建的Fiber节点
 */
export function completeWork(current, workInProgress) {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case HostRoot:
      bubbleProperties(workInProgress);
      break;
    case HostComponent:
      const { type } = workInProgress;
      if (current !== null && workInProgress.stateNode != null) {
        // 更新
        updateHostComponent(current, workInProgress, type, newProps);
      } else {
        // 创建
        const instance = createInstance(type, newProps, workInProgress);
        appendAllChildren(instance, workInProgress);
        workInProgress.stateNode = instance;
        finalizeInitialChildren(instance, type, newProps);
      }
      bubbleProperties(workInProgress);
      break;
    case FunctionComponent:
      bubbleProperties(workInProgress);
      break;
    case HostText:
      const newText = newProps;
      workInProgress.stateNode = createTextInstance(newText);
      bubbleProperties(workInProgress);
      break;
  }
}

/**
 * 冒泡处理已完成Fiber节点的属性
 * @param {Fiber} completedWork - 已完成的Fiber节点
 */
function bubbleProperties(completedWork) {
  let subtreeFlags = NoFlags;
  let child = completedWork.child;
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child = child.sibling;
  }
  completedWork.subtreeFlags = subtreeFlags;
}
