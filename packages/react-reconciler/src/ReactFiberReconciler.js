import { createFiberRoot } from './ReactFiberRoot';
import { createUpdate, enqueueUpdate } from './ReactFiberClassUpdateQueue';
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';

/**
 * 创建容器，用于将虚拟DOM转换为真实DOM并插入到容器中。
 * @param {*} containerInfo - DOM容器信息。
 * @returns {FiberRoot} - 创建的Fiber根节点。
 */
export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo);
}

/**
 * 更新容器，将虚拟DOM转换为真实DOM并插入到容器中。
 * @param {*} element - 虚拟DOM元素。
 * @param {FiberRoot} container - DOM容器
 */
export function updateContainer(element, container) {
  // 获取当前的根Fiber,也就是rootFiber
  const current = container.current;
  // 创建更新
  const update = createUpdate(); // update = { tag: 0}
  // 要更新的虚拟DOM
  update.payload = { element }; // 这里的element就是虚拟DOM
  // 将更新添加到当前根Fiber的更新队列上，并返回根节点
  const root = enqueueUpdate(current, update);
  // 在根Fiber上调度更新
  scheduleUpdateOnFiber(root);
}
