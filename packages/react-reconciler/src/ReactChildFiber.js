import { createFiberFromElement, createWorkInProgress } from './ReactFiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { Placement, ChildDeletion } from './ReactFiberFlags';
import isArray from 'shared/isArray';
import { createFiberFromText } from './ReactFiber';

/**
 * 创建Child Reconciler的函数
 *
 * @param {boolean} shouldTrackSideEffects - 是否需要跟踪副作用
 * @return {function} reconcileChildFibers - 用于处理子fiber的函数
 *
 * 这个函数会根据传入的shouldTrackSideEffects参数返回一个函数reconcileChildFibers，
 * reconcileChildFibers函数可以根据新旧Fiber进行比较并返回处理结果。
 */
function createChildReconciler(shouldTrackSideEffects) {
  /**
   * 使用旧的fiber创建新的fiber
   *
   * @param {Fiber} fiber - 旧的fiber
   * @param {object} pendingProps - 新的属性
   * @return {Fiber} clone - 新的fiber
   */
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  /**
   * 删除子fiber
   *
   * @param {Fiber} returnFiber - 新的父Fiber
   * @param {Fiber} childToDelete - 要删除的子Fiber
   */
  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) return;
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags |= ChildDeletion;
    } else {
      deletions.push(childToDelete);
    }
  }

  /**
   * 删除剩余的子fiber
   *
   * @param {Fiber} returnFiber - 新的父Fiber
   * @param {Fiber} currentFirstChild - 老fiber第一个子fiber
   */
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) return;
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }
  /**
   * 将新创建的元素转换为fiber
   *
   * @param {Fiber} returnFiber - 新的父Fiber
   * @param {Fiber} currentFirstChild - 老fiber第一个子fiber
   * @param {object} element - 新的子虚拟DOM元素
   * @return {Fiber} created - 返回新创建的Fiber
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    let oldFiber = currentFirstChild;
    while (oldFiber !== null) {
      if (oldFiber.key === element.key) {
        if (oldFiber.type === element.type) {
          // #INFO: 如果找到了相同的key和type，则删除剩余的子fiber
          deleteRemainingChildren(returnFiber, oldFiber.sibling);
          // #INFO: 复用旧的fiber
          const existing = useFiber(oldFiber, element.props);
          existing.return = returnFiber;
          return existing;
        } else {
          // #INFO: 如果找到了相同的key，但是type不同，则删除旧的fiber以及它的兄弟fiber
          deleteRemainingChildren(returnFiber, oldFiber);
        }
      } else {
        // #INFO: 如果key不同，则删除旧的fiber
        deleteChild(returnFiber, oldFiber);
      }
      oldFiber = oldFiber.sibling;
    }

    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  /**
   * 设置副作用
   *
   * @param {Fiber} newFiber - 新创建的Fiber
   * @return {Fiber} newFiber - 返回新创建的Fiber
   */
  function placeSingleChild(newFiber) {
    if (shouldTrackSideEffects) {
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  /**
   * 根据新的子节点创建Fiber
   *
   * @param {Fiber} returnFiber - 新的父Fiber
   * @param {object} newChild - 新的子节点
   * @return {Fiber | null} created - 返回新创建的Fiber，或null
   */
  function createChild(returnFiber, newChild) {
    if (
      (typeof newChild === 'string' && newChild !== null) ||
      (typeof newChild === 'number' && newChild !== null)
    ) {
      const created = createFiberFromText(`${newChild}`);
      created.return = returnFiber;
      return created;
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;
        default:
          break;
      }
    }
    return null;
  }

  /**
   * 设置副作用
   *
   * @param {Fiber} newFiber - 新创建的Fiber
   * @return {Fiber} newFiber - 返回新创建的Fiber
   */
  function placeChild(newFiber, newIndex) {
    newFiber.index = newIndex;
    if (shouldTrackSideEffects) {
      newFiber.flags |= Placement;
    }
  }

  /**
   * 将新的子节点数组与旧的子Fiber进行比较，并返回新的子Fiber
   *
   * @param {Fiber} returnFiber - 新的父Fiber
   * @param {Fiber} currentFirstFiber - 老fiber第一个子fiber
   * @param {Array} newChildren - 新的子节点数组
   * @return {Fiber} resultingFirstChild - 返回的新的子Fiber
   */
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    let resultingFirstChild = null;
    let previousNewFiber = null;
    let newIdx = 0;
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx]);
      if (newFiber === null) continue;
      placeChild(newFiber, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }

  /**
   * 将新的子节点数组与旧的子Fiber进行比较，并返回新的子Fiber
   *
   * @param {Fiber} returnFiber - 新的父Fiber
   * @param {Fiber} currentFirstFiber - 老fiber第一个子fiber
   * @param {Array} newChildren - 新的子节点数组
   * @return {Fiber} resultingFirstChild - 返回的新的子Fiber
   */
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
    // #INFO:单节点
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild));
        default:
          break;
      }
    }
    // #INFO:多节点
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
    }
    return null;
  }

  return reconcileChildFibers;
}

export const reconcileChildFibers = createChildReconciler(true);

export const mountChildFibers = createChildReconciler(false);
