import { isReadonly, shallowReadonly } from "../reactive";

/*
 * @Date: 2022-10-14 07:57:37
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-14 08:09:06
 */
describe("shallowReadonly", () => {
  // shallowReadonly 值将最外层的对象转换成readonly
  it("不需要将对象全部转换成响应式", () => {
    const props = shallowReadonly({ n: { foo: 1 } });
    expect(isReadonly(props)).toBe(true);
    expect(isReadonly(props.n)).toBe(false);
  });
  it("当调用set的时候给一个警告", () => {
    console.warn = jest.fn();
    const user = shallowReadonly({
      age: 10,
    });
    user.age = 11;
    expect(console.warn).toBeCalled();
  });
});
