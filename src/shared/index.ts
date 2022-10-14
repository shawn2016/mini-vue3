/*
 * @Date: 2022-10-13 17:49:40
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-14 17:53:08
 */
export const extend = Object.assign;

export const isObject = (val) => {
  return val !== null && typeof val === "object";
};
export function hasChanged(value, oldValue) {
  // Object.is()方法判断两个值是否是相同的值
  return !Object.is(value, oldValue);
}
