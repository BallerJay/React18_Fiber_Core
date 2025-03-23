import { HostRoot } from './ReactWorkTags';

/**
 * 并发更新队列数组，用于存储需要进行并发更新的 fiber、queue 和 update
 * 数据结构为：[fiber1, queue1, update1, fiber2, queue2, update2, ...]
 * 每三个元素为一组，分别对应一个更新操作
 * @type {Array}
 */
let concurrentQueue = [];

/**
 * 并发队列的索引指针，指向下一个可插入位置
 * 每次添加更新时，会向 concurrentQueue 中依次添加 fiber、queue、update 三个元素
 * 并将此索引增加 3
 * @type {number}
 */
let concurrentQueuesIndex = 0;

/**
 * 将更新对象添加到并发队列中。
 * @param {Fiber} fiber - 需要添加更新的 Fiber。
 * @param {Object} queue - 更新队列。
 * @param {Object} update - 需要添加的更新对象。
 */
function enqueueUpdate(fiber, queue, update) {
  // 将 fiber 对象添加到并发队列中
  concurrentQueue[concurrentQueuesIndex++] = fiber;

  // 将 queue 对象添加到并发队列中
  concurrentQueue[concurrentQueuesIndex++] = queue;

  // 将 update 对象添加到并发队列中
  concurrentQueue[concurrentQueuesIndex++] = update;
}

/**
 * 将更新对象添加到更新队列中。
 * @param {Fiber} fiber - 需要添加更新的 Fiber。
 * @param {Object} queue - 更新队列。
 * @param {Object} update - 需要添加的更新对象。
 * @returns {Fiber} - 返回添加更新后的 Fiber。
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update) {
  // 将更新对象添加到并发队列中
  enqueueUpdate(fiber, queue, update);
  // 获取当前 fiber 对应的根节点，用于后续调度更新
  // 通过向上遍历 fiber 树找到 HostRoot 类型的节点，并返回其 stateNode
  return getRootForUpdateFiber(fiber);
}

export function getRootForUpdateFiber(sourceFiber) {
  // 从当前 fiber 节点开始
  let node = sourceFiber;
  // 获取父级 fiber 节点
  let parent = sourceFiber.return;
  // 向上遍历 fiber 树，直到找到根节点（没有父节点的节点）
  while (parent !== null) {
    // 更新当前节点为父节点
    node = parent;
    // 继续获取更上一级的父节点
    parent = parent.return;
  }
  // 检查最终节点是否为 HostRoot 类型
  // 如果是 HostRoot，返回其 stateNode（即 FiberRoot）
  // 如果不是 HostRoot，返回 null
  return node.tag === HostRoot ? node.stateNode : null;
}

/**
 * 完成并发更新队列的排序和处理。
 */
export function finishQueueingConcurrentUpdates() {
  // 保存当前队列索引的结束位置
  const endIndex = concurrentQueuesIndex;
  // 重置队列索引，为下一轮更新做准备
  concurrentQueuesIndex = 0;
  // 初始化遍历索引
  let i = 0;
  // 遍历所有已入队的更新
  while (i < endIndex) {
    // 获取 fiber 对象（每三个元素为一组：fiber、queue、update）
    const fiber = concurrentQueue[i++];
    // 获取更新队列对象
    const queue = concurrentQueue[i++];
    // 获取更新对象
    const update = concurrentQueue[i++];
    // 确保队列和更新对象都存在
    if (queue !== null && update !== null) {
      // 获取队列中当前的 pending 更新
      const pending = queue.pending;
      // 如果队列为空（没有 pending 更新）
      if (pending === null) {
        // 创建一个循环链表，update 指向自身
        update.next = update;
      } else {
        // 将新的更新插入到循环链表中
        // update.next 指向链表的第一个节点
        update.next = pending.next;
        // 将原来的末尾节点指向新的更新，形成新的循环
        pending.next = update;
      }
      // 更新队列的 pending 指针，使其始终指向链表中的最后一个更新
      queue.pending = update;
    }
  }
}
/**
 * 从源 Fiber 向上遍历树，找到根节点。
 * @param {Fiber} sourceFiber - 源 Fiber。
 * @returns {Node|null} - 如果找到根节点，则返回根节点；否则返回 null。
 */
export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let node = sourceFiber;
  let parent = sourceFiber.return;
  while (parent !== null) {
    node = parent;
    parent = parent.return;
  }
  // 持续向上遍历树，直到找到根节点
  if (node.tag === HostRoot) {
    return node.stateNode;
  }
  return null;
}
