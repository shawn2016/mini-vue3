/*
 * @Date: 2022-10-12 18:01:42
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-14 07:37:20
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
  it("nested reactive", () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [
        {
          bar: 2,
        },
      ],
    };
    const observed = reactive(original);
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });
});
