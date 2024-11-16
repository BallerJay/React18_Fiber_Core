/**
 * 为DOM节点设置属性值
 *
 * @param {HTMLElement} node - 目标DOM节点
 * @param {string} name - 属性名称
 * @param {*} value - 属性值
 *
 * 如果value为null,则移除该属性
 * 否则使用setAttribute设置属性值
 */
export function setValueForProperty(node, name, value) {
  if (value === null) {
    node.removeAttribute(name);
  } else {
    node.setAttribute(name, value);
  }
}
