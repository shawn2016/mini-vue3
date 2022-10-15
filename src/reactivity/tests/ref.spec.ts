import { effect } from "../effect";
import { reactive } from "../reactive";
import { ref, isRef, unRef } from "../ref";

describe("ref", () => {
  it("happy path", () => {
    const a = ref(1);
    expect(a.value).toBe(1);
  });

  it("应该是响应式", () => {
    const a = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    // 相同额值 不应该触发trigger
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });
  it("ref 接受一个响应式对象", () => {
    const a = ref({
      count: 1,
    });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });
  it("isRef", () => {
    const a = ref(1);
    const user = reactive({
      age: 1,
    });
    expect(isRef(1)).toBe(false);
    expect(isRef(a)).toBe(true);
    expect(isRef(user)).toBe(false);
  });
  it("unRef", () => {
    const a = ref(1);
    const user = reactive({
      age: 1,
    });
    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });
});
