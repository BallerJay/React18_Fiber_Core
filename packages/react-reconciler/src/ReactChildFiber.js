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
   * @param {number} lastPlacedIndex - 上一个放置的索引
   * @param {number} newIndex - 新的索引
   * @return {Fiber} newFiber - 返回新创建的Fiber
   */
  function placeChild(newFiber, lastPlacedIndex, newIndex) {
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects) {
      return lastPlacedIndex;
    }
    const current = newFiber.alternate;
    if (current !== null) {
      const oldIndex = current.index;
      newFiber.flags |= Placement;
      if (oldIndex < lastPlacedIndex) {
        newFiber.flags |= Placement;
        return lastPlacedIndex;
      } else {
        return oldIndex;
      }
    } else {
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    }
  }

  /**
   * 更新旧的fiber
   *
   * @param {Fiber} returnFiber - 新的父Fiber
   * @param {Fiber} oldFiber - 旧的fiber
   * @param {object} newChild - 新的子节点
   * @return {Fiber | null} created - 返回新创建的Fiber，或null
   */
  function updateElement(returnFiber, oldFiber, newChild) {
    const elementType = newChild.type;
    if (oldFiber !== null) {
      if (oldFiber.type === elementType) {
        const existing = useFiber(oldFiber, newChild.props);
        existing.return = returnFiber;
        return existing;
      }
    }
    const created = createFiberFromElement(newChild);
    created.return = returnFiber;
    return created;
  }

  /**
   * 更新旧的fiber
   *
   * @param {Fiber} returnFiber - 新的父Fiber
   * @param {Fiber} oldFiber - 旧的fiber
   * @param {object} newChild - 新的子节点
   * @return {Fiber | null} created - 返回新创建的Fiber，或null
   */
  function updateSlot(returnFiber, oldFiber, newChild) {
    // 获取旧fiber的key,如果旧fiber不存在则为null
    const key = oldFiber !== null ? oldFiber.key : null;

    // 判断新的子节点是否为React元素
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          if (newChild.key === key) {
            return updateElement(returnFiber, oldFiber, newChild);
          }
        default:
          return null;
      }
    }
    return null;
  }

  function mapRemainingChildren(returnFiber, currentFirstChild) {
    const existingChildren = new Map();
    let existingChild = currentFirstChild;
    while (existingChild !== null) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }
    return existingChildren;
  }

  /**
   * 如果当前节点是文本节点则复用，否则创建新的文本节点。
   * @param {Fiber} returnFiber - 父级Fiber节点
   * @param {Fiber} current - 当前处理的Fiber节点
   * @param {string} textContent - 文本内容
   * @returns {Fiber} 新的或者复用的文本节点
   */
  function updateTextNode(returnFiber, current, textContent) {
    if (current === null || current.tag !== HostText) {
      const created = createFiberFromText(textContent);
      created.return = returnFiber;
      return created;
    } else {
      const existing = useFiber(current, textContent);
      existing.return = returnFiber;
      return existing;
    }
  }

  /**
   * 从现有的子节点映射中更新Fiber节点
   * @param {Map} existingChildren - 现有的子节点映射
   * @param {Fiber} returnFiber - 父级Fiber节点
   * @param {number} newIdx - 新节点的索引
   * @param {any} newChild - 新的子节点
   * @returns {Fiber} 更新后的Fiber节点
   */
  function updateFromMap(existingChildren, returnFiber, newIdx, newChild) {
    if ((typeof newChild === 'string' && newChild !== '') || typeof newChild === 'number') {
      const matchedFiber = existingChildren.get(newIdx) ?? null;
      return updateTextNode(returnFiber, matchedFiber, newChild + '');
    }
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          const matchedFiber =
            existingChildren.get(newChild.key === null ? newIdx : newChild.key) ?? null;
          return updateElement(returnFiber, matchedFiber, newChild);
      }
    }
  }

  /**
   * 将新的子节点数组与旧的子Fiber进行比较，并返回新的子Fiber
   *
   * @param {Fiber} returnFiber - 新的父Fiber
   * @param {Fiber} currentFirstChild - 老fiber第一个子fiber
   * @param {Array} newChildren - 新的子节点数组
   * @return {Fiber} resultingFirstChild - 返回的新的子Fiber
   */
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    let resultingFirstChild = null;
    let previousNewFiber = null;
    let newIdx = 0;

    let oldFiber = currentFirstChild;
    let nextOldFiber = null;

    let lastPlacedIndex = 0;

    // #INFO: 第一套方案：同序更新
    // 遍历旧的fiber链表和新的子元素数组,尝试复用旧的fiber节点
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      // 获取当前旧fiber的下一个兄弟fiber
      nextOldFiber = oldFiber.sibling;
      // 尝试复用旧的fiber节点,创建新的fiber
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx]);
      // 如果无法复用,则跳出循环
      if (newFiber === null) {
        break;
      }
      // 如果需要追踪副作用
      if (shouldTrackSideEffects) {
        // 如果存在旧fiber但没有复用(alternate为null),则需要删除旧fiber
        if (oldFiber && newFiber.alternate === null) {
          deleteChild(returnFiber, oldFiber);
        }
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      // 构建新的fiber链表
      if (previousNewFiber === null) {
        // 如果是第一个新fiber,则作为结果的第一个子fiber
        resultingFirstChild = newFiber;
      } else {
        // 否则将新fiber添加到前一个fiber的后面
        previousNewFiber.sibling = newFiber;
      }
      // 记录前一个新fiber,用于构建fiber链表
      previousNewFiber = newFiber;
      // 移动到下一个旧fiber
      oldFiber = nextOldFiber;
    }

    // #INFO: 第二套方案, 老fiber遍历完了, 新的子节点数组还有剩余
    if (oldFiber === null) {
      // 继续遍历剩余的新子节点数组
      for (; newIdx < newChildren.length; newIdx++) {
        // 根据新的子节点创建对应的fiber
        const newFiber = createChild(returnFiber, newChildren[newIdx]);
        // 如果创建失败则跳过当前节点
        if (newFiber === null) continue;
        // 设置新fiber的副作用标记
        placeChild(newFiber, newIdx);
        // 如果是第一个fiber节点,则作为结果的第一个子fiber
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber;
        } else {
          // 否则将新fiber添加到前一个fiber的后面
          previousNewFiber.sibling = newFiber;
        }
        // 记录前一个新fiber,用于构建fiber链表
        previousNewFiber = newFiber;
      }
    }

    // #INFO: 第三套方案, 新的子节点数组遍历完了, 老fiber还有剩余
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
    for (; newIdx < newChildren.length; newIdx++) {
      // 从现有子节点Map中尝试复用或创建新的fiber节点
      const newFiber = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx]);
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          // 如果fiber被复用(alternate不为null),则从Map中删除对应的key
          // 这样Map中剩下的就是没有被复用的节点,后续需要删除
          if (newFiber.alternate !== null) {
            existingChildren.delete(newFiber.key === null ? newIdx : newFiber.key);
          }
        }
      }
      // 设置新fiber的位置信息
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

      // 构建fiber链表
      if (previousNewFiber === null) {
        // 如果是第一个fiber,则作为结果的第一个子fiber
        resultingFirstChild = newFiber;
      } else {
        // 否则将新fiber添加到前一个fiber的后面
        previousNewFiber.sibling = newFiber;
      }
      // 记录前一个新fiber,用于构建fiber链表
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
