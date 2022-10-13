/*
 * @Date: 2022-10-12 18:01:42
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-13 18:27:52
 */
import { isReactive, reactive } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const original = {
      foo: 1,
    };
    const observed = reactive(original);
    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(1);
    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
  });
});
