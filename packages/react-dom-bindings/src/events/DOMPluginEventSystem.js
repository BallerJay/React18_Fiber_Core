import { allNativeEvents } from './EventRegistry';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin';
import { createEventListenerWrapperWithPriority } from './ReactDOMEventListener';
import { addEventCaptureListener, addEventBubbleListener } from './EventListener';
import getEventTarget from './getEventTarget';
import getListener from './getListener';
import { HostComponent } from 'react-reconciler/src/ReactWorkTags';

import { IS_CAPTURE_PHASE } from './EventSystemFlags';

SimpleEventPlugin.registerEvents();

// #INFO: 随机生成一个字符串，用于标记当前事件监听器是否已经注册
const listeningMarker = `_reactListening` + Math.random().toString(36).slice(2);

/**
 * 监听所有支持的事件
 * @param {*} rootContainerElement 真实DOM容器，也就是React应用的根DOM节点
 */
export function listenToAllSupportedEvents(rootContainerElement) {
  if (!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = true;
    allNativeEvents.forEach(domEventName => {
      // #INFO: 监听捕获阶段的事件
      listenToNativeEvent(domEventName, true, rootContainerElement);
      // #INFO: 监听冒泡阶段的事件
      listenToNativeEvent(domEventName, false, rootContainerElement);
    });
  }
}

/**
 * 监听原生事件
 * @param {string} domEventName DOM 事件名称
 * @param {boolean} isCapturePhaseListener 是否在捕获阶段监听
 * @param {Element} target 目标元素
 */
export function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
  let eventSystemFlags = 0;
  // 如果在捕获阶段监听，设置事件系统标记
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }
  addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener);
}

/**
 * 添加受限制的事件监听器
 * @param {Element} targetContainer 目标容器元素
 * @param {string} domEventName DOM 事件名称
 * @param {number} eventSystemFlags 事件系统标记
 * @param {boolean} isCapturePhaseListener 是否在捕获阶段监听
 */
function addTrappedEventListener(
  targetContainer,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener
) {
  // 创建带有优先级的事件监听器
  const listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags
  );
  // 根据监听阶段选择合适的添加监听函数
  if (isCapturePhaseListener) {
    addEventCaptureListener(targetContainer, domEventName, listener);
  } else {
    addEventBubbleListener(targetContainer, domEventName, listener);
  }
}

/**
 * 在插件事件系统中分发事件
 * @param {string} domEventName DOM事件名称
 * @param {number} eventSystemFlags 事件系统标记
 * @param {Event} nativeEvent 原生事件
 * @param {Fiber} targetInst Fiber目标实例
 * @param {Element} targetContainer 目标容器元素
 */
export function dispatchEventForPluginEventSystem(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  targetContainer
) {
  dispatchEventForPlugins(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer);
}

/**
 * 为插件分发事件
 * @param {string} domEventName DOM事件名称
 * @param {number} eventSystemFlags 事件系统标记
 * @param {Event} nativeEvent 原生事件
 * @param {Fiber} targetInst Fiber目标实例
 * @param {Element} targetContainer 目标容器元素
 */
function dispatchEventForPlugins(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  targetContainer
) {
  // 获取原生事件的目标
  const nativeEventTarget = getEventTarget(nativeEvent);
  const dispatchQueue = [];
  // 提取事件
  extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  );
  // 处理分发队列
  processDispatchQueue(dispatchQueue, eventSystemFlags);
}

/**
 * 提取事件
 * @param {Array} dispatchQueue 分发队列
 * @param {string} domEventName DOM事件名称
 * @param {Fiber} targetInst Fiber目标实例
 * @param {Event} nativeEvent 原生事件
 * @param {EventTarget} nativeEventTarget 原生事件目标
 * @param {number} eventSystemFlags 事件系统标记
 * @param {Element} targetContainer 目标容器元素
 */
function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer
) {
  SimpleEventPlugin.extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  );
}

/**
 * 累积单阶段监听器
 * @param {Fiber} targetFiber 目标Fiber实例
 * @param {string} reactName React事件名称
 * @param {string} nativeEventType 原生事件类型
 * @param {boolean} isCapturePhase 是否在捕获阶段
 */
export function accumulateSinglePhaseListeners(
  targetFiber,
  reactName,
  nativeEventType,
  isCapturePhase
) {
  const captureName = reactName + 'Capture';
  const reactEventName = isCapturePhase ? captureName : reactName;
  const listeners = [];
  let instance = targetFiber;
  while (instance !== null) {
    const { stateNode, tag } = instance;
    if (tag === HostComponent && stateNode !== null) {
      const listener = getListener(instance, reactEventName);
      if (listener) {
        listeners.push(createDispatchListener(instance, listener, stateNode));
      }
    }
    // 向上遍历fiber树，获取父fiber节点
    instance = instance.return;
  }
  return listeners;
}

/**
 * 创建分发监听器
 * @param {Fiber} instance Fiber实例
 * @param {Function} listener 监听器函数
 * @param {Element} currentTarget 当前目标元素
 */
function createDispatchListener(instance, listener, currentTarget) {
  return { instance, listener, currentTarget };
}

/**
 * 处理分发队列
 * @param {Array} dispatchQueue 分发队列
 * @param {number} eventSystemFlags 事件系统标记
 */
function processDispatchQueue(dispatchQueue, eventSystemFlags) {
  // 判断是否在捕获阶段
  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
  for (let i = 0; i < dispatchQueue.length; i++) {
    const { event, listeners } = dispatchQueue[i];
    // 按顺序处理分发队列中的项目
    processDispatchQueueItemsInOrder(event, listeners, isCapturePhase);
  }
}

/**
 * 执行分发
 * @param {Event} event 事件
 * @param {Function} listener 监听器函数
 * @param {Element} currentTarget 当前目标元素
 */
function executeDispatch(event, listener, currentTarget) {
  event.currentTarget = currentTarget;
  listener(event);
}

/**
 * 按顺序处理分发队列中的项目
 * @param {Event} event 事件
 * @param {Array} dispatchListeners 分发监听器列表
 * @param {boolean} isCapturePhase 是否在捕获阶段
 */
function processDispatchQueueItemsInOrder(event, dispatchListeners, isCapturePhase) {
  if (isCapturePhase) {
    // 捕获阶段，从后往前遍历
    for (let i = dispatchListeners.length - 1; i >= 0; i--) {
      const { listener, currentTarget } = dispatchListeners[i];
      if (event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
    }
  } else {
    // 冒泡阶段，从前往后遍历
    for (let i = 0; i < dispatchListeners.length; i++) {
      const { listener, currentTarget } = dispatchListeners[i];
      if (event.isPropagationStopped()) {
        return;
      }
      executeDispatch(event, listener, currentTarget);
    }
  }
}
