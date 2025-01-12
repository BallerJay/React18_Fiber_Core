const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = '__reactFiber$' + randomKey;
const internalPropsKey = '__reactProps$' + randomKey;

/**
 * @description: 将fiber节点与DOM元素关联
 * @param {*} hostInst
 * @param {*} node
 */
export function precacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst;
}

/**
 * @description: 将fiber节点的props与DOM元素关联
 * @param {*} node
 * @param {*} props
 */
export function updateFiberProps(node, props) {
  node[internalPropsKey] = props;
}

/**
 * @description: 从节点中获取fiber实例
 * @param {*} targetNode
 * @returns
 */
export function getClosestInstanceFromNode(targetNode) {
  const targetInst = targetNode[internalInstanceKey];
  return targetInst;
}

/**
 * @description: 从节点中获取fiber节点的props
 * @param {*} node
 * @returns
 */
export function getFiberCurrentPropsFromNode(node) {
  return node[internalPropsKey] || null;
}
