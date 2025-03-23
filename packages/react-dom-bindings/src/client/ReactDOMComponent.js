import { setValueForStyles } from './CSSPropertyOperations';
import { setTextContent } from './setTextContent';
import { setValueForProperty } from './DOMPropertyOperations';

export function setInitialProperties(domElement, tag, props) {
  setInitialDOMProperties(tag, domElement, props);
}

function setInitialDOMProperties(tag, domElement, nextProps) {
  for (const propKey in nextProps) {
    if (nextProps.hasOwnProperty(propKey)) {
      const nextProp = nextProps[propKey];
      if (propKey === 'style') {
        setValueForStyles(domElement, nextProp);
      } else if (propKey == 'children') {
        if (typeof nextProp === 'string') {
          setTextContent(domElement, nextProp);
        } else if (typeof nextProp === 'number') {
          setTextContent(domElement, `${nextProp}`);
        }
      } else if (nextProp !== null) {
        setValueForProperty(domElement, propKey, nextProp);
      }
    }
  }
}

/**
 * @description 比较新旧属性，返回更新负载
 * @param {HTMLElement} domElement - 真实的DOM元素
 * @param {string} type - 元素类型
 * @param {Object} lastProps - 旧的属性
 * @param {Object} newProps - 新的属性
 * @return {Object} 更新负载
 */
export function diffProperties(domElement, type, lastProps, nextProps) {
  let updatePayload = null;
  let propKey;
  let styleName;
  let styleUpdates = null;

  for (propKey in lastProps) {
    // 跳过处理的情况：
    // 1. 新属性中已存在该属性 - 会在下面的新属性循环中处理
    // 2. 旧属性中不存在该属性 - 不需要处理不存在的属性
    // 3. 新旧属性值相同 - 不需要更新相同的值
    if (
      nextProps.hasOwnProperty(propKey) ||
      !lastProps.hasOwnProperty(propKey) ||
      lastProps[propKey] === null
    ) {
      continue;
    }
    // 特殊处理样式属性
    if (propKey === 'style') {
      const lastStyle = lastProps[propKey];
      // 遍历旧样式对象中的所有样式属性
      for (styleName in lastStyle) {
        if (lastStyle.hasOwnProperty(styleName)) {
          // 首次遇到样式更新时初始化styleUpdates对象
          if (!styleUpdates) {
            styleUpdates = {};
          }
          // 将样式值设为空字符串，表示需要移除该样式
          styleUpdates[styleName] = '';
        }
      }
    } else {
      // 如果更新负载为空，则初始化为空数组
      updatePayload = updatePayload || [];
      // 将属性名和null值添加到更新负载中，表示该属性需要被移除
      updatePayload.push(propKey, null);
    }
  }

  for (propKey in nextProps) {
    // 获取新属性中的当前属性值
    const nextProp = nextProps[propKey];
    // 获取旧属性中的当前属性值，如果旧属性为null则返回undefined
    const lastProp = lastProps !== null ? lastProps[propKey] : undefined;
    // 跳过处理的情况：
    // 1. 新属性对象中不存在该属性（通过hasOwnProperty检查）
    // 2. 新旧属性值完全相同 - 不需要更新
    // 3. 新旧属性值都为null - 不需要更新
    // 跳过处理的情况：
    // 1. 新属性对象中不存在该属性
    // 2. 新旧属性值完全相同
    // 3. 新旧属性值都为null
    if (
      !nextProps.hasOwnProperty(propKey) ||
      lastProp === nextProp ||
      (nextProp === null && lastProp === null)
    ) {
      continue;
    }
    // 特殊处理样式属性
    if (propKey === 'style') {
      if (lastProp) {
        // 处理旧样式中存在但新样式中不存在的样式属性
        for (styleName in lastProp) {
          if (
            lastProp.hasOwnProperty(styleName) &&
            (!nextProp || !nextProp.hasOwnProperty(styleName))
          ) {
            // 首次遇到样式更新时初始化styleUpdates对象
            if (!styleUpdates) {
              styleUpdates = {};
            }
            // 将样式值设为空字符串，表示需要移除该样式
            styleUpdates[styleName] = '';
          }
        }

        // 处理新样式中与旧样式不同的样式属性
        for (styleName in nextProp) {
          if (nextProp.hasOwnProperty(styleName) && lastProp[styleName] !== nextProp[styleName]) {
            // 首次遇到样式更新时初始化styleUpdates对象
            if (!styleUpdates) {
              styleUpdates = {};
            }
            // 更新样式值为新的值
            styleUpdates[styleName] = nextProp[styleName];
          }
        }
      } else {
        // 如果旧样式不存在，直接使用新样式对象
        styleUpdates = nextProp;
      }
    } else if (propKey === 'children') {
      // 特殊处理子元素属性，只有当子元素是字符串或数字时才更新
      if (typeof nextProp === 'string' || typeof nextProp === 'number') {
        // 初始化更新负载数组（如果尚未初始化）
        updatePayload = updatePayload || [];
        // 将属性名和新值添加到更新负载中
        updatePayload.push(propKey, nextProp);
      }
      // else if (Array.isArray(nextProp)) {
      //   // #TODO: 临时方案
      //   updatePayload = updatePayload || [];
      //   updatePayload.push(propKey, nextProp.join(''));
      // }
    } else {
      // 处理其他普通属性
      // 初始化更新负载数组（如果尚未初始化）
      updatePayload = updatePayload || [];
      // 将属性名和新值添加到更新负载中
      updatePayload.push(propKey, nextProp);
    }
  }

  // 如果有样式更新，将样式更新添加到更新负载中
  if (styleUpdates) {
    updatePayload = updatePayload || [];
    updatePayload.push('style', styleUpdates);
  }

  // 返回更新负载，可能为null（表示没有需要更新的属性）或包含属性名和值的数组
  return updatePayload;
}

export function updateProperties(domElement, updatePayload) {
  updateDOMProperties(domElement, updatePayload);
}

function updateDOMProperties(domElement, updatePayload) {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propKey === 'style') {
      setValueForStyles(domElement, propValue);
    } else if (propKey === 'children') {
      setTextContent(domElement, propValue);
    } else {
      setValueForProperty(domElement, propKey, propValue);
    }
  }
}
