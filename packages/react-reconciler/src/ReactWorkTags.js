/**
 * @description 表示函数式组件，这是 React 中最基础的组件类型，通过函数返回 UI 结构
 */
export const FunctionComponent = 0;
/**
 * @description 表示类组件，这是 React 的另一种主要组件类型，通过 class 定义，可以使用生命周期方法等更复杂的特性
 */
export const ClassComponent = 1;
/**
 * @description 表示尚未确定类型的组件，在 React 渲染过程中，如果遇到了这种类型，会先尝试将其当做函数式组件处理
 */
export const IndeterminateComponent = 2;
/**
 * @description 宿主树中的根节点  对应的是 RootFiber
 * @description 表示宿主环境的根节点，例如在浏览器环境中，这个就代表了整个 React App 的根节点
 */
export const HostRoot = 3; //
/**
 * @description 表示一个子树，可以是一个不同的渲染器入口
 */
export const HostPortal = 4;
/**
 * @description 表示宿主环境的常规节点，例如在浏览器环境中，这就代表了一个普通的 DOM 元素，如 div、span 等
 */
export const HostComponent = 5;
/**
 * @description 表示宿主环境的文本节点，例如在浏览器环境中，这就代表了一个文本节点
 */
export const HostText = 6;
export const Fragment = 7;
export const Mode = 8;
export const ContextConsumer = 9;
export const ContextProvider = 10;
export const ForwardRef = 11;
export const Profiler = 12;
export const SuspenseComponent = 13;
export const MemoComponent = 14;
export const SimpleMemoComponent = 15;
export const LazyComponent = 16;
export const IncompleteClassComponent = 17;
export const DehydratedFragment = 18;
export const SuspenseListComponent = 19;
export const ScopeComponent = 21;
export const OffscreenComponent = 22;
export const LegacyHiddenComponent = 23;
export const CacheComponent = 24;
export const TracingMarkerComponent = 25;
