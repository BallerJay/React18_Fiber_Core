// import { createRoot } from 'react-dom/client';
// let element = (
//   <div
//     onClick={() => console.log('ParentNodeBubble')}
//     onClickCapture={event => {
//       console.log('parentNodeCapture');
//       // event.stopPropagation();
//     }}>
//     <div>课程名称：手写React高质量源码迈向高阶开发</div>
//     <div
//       onClick={event => {
//         console.log('ChildNodeBubble');
//         // event.stopPropagation();
//       }}
//       onClickCapture={event => {
//         console.log('ChildNodeCapture');
//       }}>
//       讲师：杨艺韬
//     </div>
//     <div>
//       电子书：
//       <a style={{ color: 'blue' }} href="https://www.yangyitao.com/react18">
//         https://www.yangyitao.com/react18
//       </a>
//     </div>
//   </div>
// );
// const root = createRoot(document.getElementById('root'));
// root.render(element);
// console.log('index.jsx', element);

// import { createRoot } from 'react-dom/client';
// const root = createRoot(document.getElementById('root'));
// function FunctionComponent() {
//   return (
//     <div>
//       <div>课程名称：手写React高质量源码迈向高阶开发</div>
//       <div>讲师：杨艺韬</div>
//       <div>
//         电子书：
//         <a style={{ color: 'blue' }} href="https://www.yangyitao.com/react18">
//           https://www.yangyitao.com/react18
//         </a>
//       </div>
//     </div>
//   );
// }
// root.render(<FunctionComponent />);
// console.log('index.jsx', <FunctionComponent />);

// -------------- useReducer --------------

import { createRoot } from 'react-dom/client';
import { useReducer } from 'react';
function getAgeReducer(state, action) {
  switch (action.type) {
    case 'increment':
      return state + 1;
    case 'decrement':
      return state - 1;
    default:
      return state;
  }
}

function MyFunctionComponent() {
  const [age, dispatch] = useReducer(getAgeReducer, 0);
  return (
    <div>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      {/* #TODO: 更新渲染有问题 */}
      {/* <span>Age: {age}</span> */}
      <span>{age}</span>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<MyFunctionComponent />);
