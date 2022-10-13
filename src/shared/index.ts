/*
 * @Date: 2022-10-13 17:49:40
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-14 07:49:38
 */
export const extend = Object.assign;

export const isObject = (val) => {
  return val !== null && typeof val === "object";
};
