import { isProxy, isReadonly, readonly } from "../reactive";

/*
 * @Date: 2022-10-13 17:55:00
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-14 14:22:27
 */
describe("readonly", () => {
  // 不能 set
  it("happy path", () => {
    const original = {
      foo: 1,
      bar: {
        baz: 2,
      },
    };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(original)).toBe(false);
    // 新增嵌套
    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReadonly(original.bar)).toBe(false);
    // 新增isProxy
    expect(isProxy(wrapped)).toBe(true);
    expect(isProxy(original)).toBe(false);
  });

  it("当调用set的时候给一个警告", () => {
    console.warn = jest.fn();
    const user = readonly({
      age: 10,
    });
    user.age = 11;
    expect(console.warn).toBeCalled();
  });
});
