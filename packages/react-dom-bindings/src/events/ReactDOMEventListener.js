import getEventTarget from './getEventTarget';
import { getClosestInstanceFromNode } from 'react-dom-bindings/src/client/ReactDOMComponentTree';
import { dispatchEventForPluginEventSystem } from './DOMPluginEventSystem';

/**
 * 创建一个具有优先级的事件监听器包装器。
 *
 * @param {HTMLElement} targetContainer - 目标容器，通常是一个HTML元素。
 * @param {string} domEventName - DOM事件名称。
 * @param {number} eventSystemFlags - 事件系统标志，用于表示事件在哪个阶段（冒泡/捕获）。
 * @returns {function} - 绑定了特定参数的事件调度函数。
 */
export function createEventListenerWrapperWithPriority(
  targetContainer,
  domEventName,
  eventSystemFlags
) {
  const listenerWrapper = dispatchDiscreteEvent;
  // #INFO: 绑定事件名称、事件系统标志和目标容器
  return listenerWrapper.bind(null, domEventName, eventSystemFlags, targetContainer);
}

/**
 * 调度离散事件。
 *
 * @param {string} domEventName - DOM事件名称。
 * @param {number} eventSystemFlags - 事件系统标志，用于表示事件在哪个阶段（冒泡/捕获）。
 * @param {HTMLElement} container - 目标容器，通常是一个HTML元素。
 * @param {Event} nativeEvent - 原生的浏览器事件对象。
 */
function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
  dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
}

/**
 * 调度一个事件。
 *
 * @param {string} domEventName - DOM事件名称。
 * @param {number} eventSystemFlags - 事件系统标志，用于表示事件在哪个阶段（冒泡/捕获）。
 * @param {HTMLElement} targetContainer - 目标容器，通常是一个HTML元素。
 * @param {Event} nativeEvent - 原生的浏览器事件对象。
 */
export function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
  const nativeEventTarget = getEventTarget(nativeEvent);
  const targetInstance = getClosestInstanceFromNode(nativeEventTarget);
  dispatchEventForPluginEventSystem(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInstance,
    targetContainer
  );
}
