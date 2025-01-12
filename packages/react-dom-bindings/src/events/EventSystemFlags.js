/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// export type EventSystemFlags = number;

// 标记事件处理程序是否处理非托管节点
export const IS_EVENT_HANDLE_NON_MANAGED_NODE = 1; // 00000001

// 标记事件是否为非委托事件
export const IS_NON_DELEGATED = 1 << 1; // 00000010

// 标记事件是否在捕获阶段
export const IS_CAPTURE_PHASE = 1 << 2; // 00000100

// 标记事件是否为被动事件
export const IS_PASSIVE = 1 << 3; // 00001000

// 标记是否启用 Facebook 旧版支持模式
export const IS_LEGACY_FB_SUPPORT_MODE = 1 << 4; // 00010000

// 用于判断是否不应延迟处理 Facebook 支持模式下的点击事件
// 当事件处于捕获阶段或启用了旧版支持模式时，不应延迟处理
export const SHOULD_NOT_DEFER_CLICK_FOR_FB_SUPPORT_MODE =
  IS_LEGACY_FB_SUPPORT_MODE | IS_CAPTURE_PHASE;

// 我们不希望在以下情况下延迟处理:
// 1. 事件系统已设置为 LEGACY_FB_SUPPORT 模式
// 2. LEGACY_FB_SUPPORT 仅在调用 willDeferLaterForLegacyFBSupport 时设置
// 3. 不及时退出将导致无限循环
// 4. 在事件重放期间也不希望延迟
export const SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS =
  IS_EVENT_HANDLE_NON_MANAGED_NODE | IS_NON_DELEGATED | IS_CAPTURE_PHASE;
