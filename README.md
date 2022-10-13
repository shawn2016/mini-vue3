<!--
 * @Date: 2022-10-12 14:51:59
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-14 07:52:52
-->
# mini-vue
## 第五节实战课-setup环境-集成jest做单元测试-集成 ts
```bash
yarn init -y
```
创建文件夹src/reactivity/index.ts
创建测试文件src/reactivity/tests/index.spec.ts
```js
descript("reactivity", () => {
  it("init", () => {
    expect(true).toBe(1);
  });
});
```
### 集成tsc
```bash
npx tsc --init
```
自动生成tsconfig.js

### 集成jest
```bash
yarn add jest @types/jest --dev
```
修改tsconfig.js中的types
```json
types:["jest"]
noImplicitAny: false // 去除any提示
```
修改scripts,新增scripts脚本
```json
 "scripts": {
    "test": "jest"
  }
```

因为使用到了import 会报错：
```bash
SyntaxError: Cannot use import statement outside a module
```
所以需要新增babel, https://jestjs.io/docs/getting-started
```bash
yarn add --dev babel-jest @babel/core @babel/preset-env
``` 
### 新增babel.config.js
```js
module.exports = {
  presets: [['@babel/preset-env', {targets: {node: 'current'}}],
  '@babel/preset-typescript'],
};
```

### 支持TS
```bash
yarn add --dev @babel/preset-typescript
```
## 第六节实战课-实现 effect & reactive & 依赖收集 & 触发依赖

修改tsconfig.js中的types
```json
 "lib": [
      "DOM",
      "ES6"
    ]
```

effect,spec.ts
```js
import { effect } from "../effect";
import { reactive } from "../reactive";
describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });
    expect(nextAge).toBe(11);

    // update
    user.age++;
    expect(nextAge).toBe(12);
  });
});

```
effect.ts
```js
class ReactiveEffect {
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    this._fn();
  }
}
const targetMap = new Map();
export function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    // targetMap 中没有以target为key 的值，所以新增一个map放进去
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    // 如果depsMap没有以key为key的值 所以新增一个set进去
    dep = new Set();
    depsMap.set(key, dep);
  }
  dep.add(activeEffect);
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    effect.run();
  }
}
let activeEffect;
export function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}

```
reactive.ts
```js
import { track, trigger } from "./effect";
export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key);
      //  TODO 依赖收集
      track(target, key);
      return res;
    },
    set(target, key, value) {
      const res = Reflect.set(target, key, value);
      //   TODO 触发依赖
      trigger(target, key);
      return res;
    },
  });
}

```

## 第七节实战课-07-实现 effect 返回 runner
effect.ts
```js
class ReactiveEffect {
  constructor(fn) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    return this._fn();
  }
}
const targetMap = new Map();
export function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    // targetMap 中没有以target为key 的值，所以新增一个map放进去
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    // 如果depsMap没有以key为key的值 所以新增一个set进去
    dep = new Set();
    depsMap.set(key, dep);
  }
  dep.add(activeEffect);
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    effect.run();
  }
}
let activeEffect;
export function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
  return _effect.run.bind(_effect);
}

```

effect.spec.ts
```js
import { effect } from "../effect";
import { reactive } from "../reactive";
describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });
    expect(nextAge).toBe(11);

    // update
    user.age++;
    expect(nextAge).toBe(12);
  });
  it("当调用effect时应该返回一个runner", () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });
    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });
});

```
## 第八节实战课-实现 effect.scheduler 功能
新增测试用例 effect.spec.ts
```js
import { effect } from "../effect";
import { reactive } from "../reactive";
describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });
    expect(nextAge).toBe(11);

    // update
    user.age++;
    expect(nextAge).toBe(12);
  });
  it("当调用effect时应该返回一个runner", () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });
    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });
  it("scheduler", () => {
    // 1 通过effect的第二个参数给定一个scheduler 的fn
    // 2 effect 第一次执行的时候 还会执行fn
    // 3. 当响应式对象 set update 不会执行fn 而是执行 scheduler
    // 4. 如果说当执行runner 的时候，会再次的执行 fn
    let dummy;
    let run;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({
      foo: 1,
    });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        scheduler,
      }
    );
    // 断言 不会被调用
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);

    obj.foo++;
    // 验证 被传入的scheduler被调用一次
    expect(scheduler).toHaveBeenCalledTimes(1);
    // 说明scheduler被调用一次  但是不会执行effect第一个参数
    expect(dummy).toBe(1);
    run();
    expect(dummy).toBe(2);
  });
});

```
```ts
class ReactiveEffect {
  private _fn: any;
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }
  run() {
    activeEffect = this;
    return this._fn();
  }
}
const targetMap = new Map();
export function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    // targetMap 中没有以target为key 的值，所以新增一个map放进去
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    // 如果depsMap没有以key为key的值 所以新增一个set进去
    dep = new Set();
    depsMap.set(key, dep);
  }
  dep.add(activeEffect);
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
let activeEffect;
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);

  _effect.run();

  return _effect.run.bind(_effect);
}

```

## 第九节实战课-实现 effect 的 stop 功能
effect.spec.ts
```ts
/*
 * @Date: 2022-10-12 17:46:35
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-13 17:45:46
 */
import { effect, stop } from "../effect";
import { reactive } from "../reactive";
describe("effect", () => {
  it("happy path", () => {
    const user = reactive({
      age: 10,
    });
    let nextAge;
    effect(() => {
      nextAge = user.age + 1;
    });
    expect(nextAge).toBe(11);

    // update
    user.age++;
    expect(nextAge).toBe(12);
  });
  it("当调用effect时应该返回一个runner", () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });
    expect(foo).toBe(11);
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });
  it("scheduler", () => {
    // 1 通过effect的第二个参数给定一个scheduler 的fn
    // 2 effect 第一次执行的时候 还会执行fn
    // 3. 当响应式对象 set update 不会执行fn 而是执行 scheduler
    // 4. 如果说当执行runner 的时候，会再次的执行 fn
    let dummy;
    let run;
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({
      foo: 1,
    });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        scheduler,
      }
    );
    // 断言 不会被调用
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);

    obj.foo++;
    // 验证 被传入的scheduler被调用一次
    expect(scheduler).toHaveBeenCalledTimes(1);
    // 说明scheduler被调用一次  但是不会执行effect第一个参数
    expect(dummy).toBe(1);
    run();
    expect(dummy).toBe(2);
  });
  it("stop", () => {
    let dummy;
    const obj = reactive({
      prop: 1,
    });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    obj.prop = 3;
    expect(dummy).toBe(2);

    runner();
    expect(dummy).toBe(3);
  });
  it("onStop", () => {
    const obj = reactive({
      foo: 1,
    });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        onStop,
      }
    );
    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
});

```
effect.ts
```ts
import { extend } from "../shared";

/*
 * @Date: 2022-10-12 17:49:32
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-13 17:52:45
 */
class ReactiveEffect {
  private _fn: any;
  public deps = [];
  active = true;
  onStop?: () => void;
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }
  run() {
    activeEffect = this as any;
    return this._fn();
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}
function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
}
const targetMap = new Map();
export function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    // targetMap 中没有以target为key 的值，所以新增一个map放进去
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    // 如果depsMap没有以key为key的值 所以新增一个set进去
    dep = new Set();
    depsMap.set(key, dep);
  }
  if (!activeEffect) return;
  dep.add(activeEffect);
  // 反向收集deps，帮助stop清空
  (activeEffect as any).deps.push(dep);
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
// 保存
let activeEffect: any;
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  // _effect.onStop = options.onStop; // 下面的写法更加优雅
  // Object.assign(_effect, options);
  extend(_effect, options);

  _effect.run();
  const runner: any = _effect.run.bind(_effect);
  // 保存依赖
  runner.effect = _effect;

  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}

```

## 第十节实战课-实现 readonly 功能

reactive.ts
```ts
/*
 * @Date: 2022-10-12 17:55:50
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-13 18:10:03
 */
import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

export function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
}
function createReactiveObject(raw: any, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}

```
readonly.spec.ts
```ts
import { readonly } from "../reactive";

/*
 * @Date: 2022-10-13 17:55:00
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-13 18:14:56
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

```
baseHandlers.ts
```ts
/*
 * @Date: 2022-10-13 18:04:18
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-13 18:16:10
 */
import { track, trigger } from "./effect";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    );
    return true;
  },
};

function createGetter(isReadonly = false) {
  return function get(target, key) {
    const res = Reflect.get(target, key);
    if (!isReadonly) {
      //  TODO 依赖收集
      track(target, key);
    }
    return res;
  };
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);
    //   TODO 触发依赖
    trigger(target, key);
    return res;
  };
}

```
## 第十一节实战课-实现 isReactive 和 isReadonly
reactive.ts
```ts
/*
 * @Date: 2022-10-12 17:55:50
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-13 18:27:29
 */
import { mutableHandlers, readonlyHandlers } from "./baseHandlers";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
}

export function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
}
function createReactiveObject(raw: any, baseHandlers) {
  return new Proxy(raw, baseHandlers);
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function isReactive(value) {
  // 如果 value 是 proxy 的话
  // 会触发 get 操作，而在 createGetter 里面会判断
  // 如果 value 是普通对象的话
  // 那么会返回 undefined ，那么就需要转换成布尔值
  return !!value[ReactiveFlags.IS_REACTIVE];
}


```
reactive.spec.ts
```ts
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
```

readonly.spec.ts
```ts
import { isReadonly, readonly } from "../reactive";

/*
 * @Date: 2022-10-13 17:55:00
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-13 18:28:38
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

```
## 第十二节实战课-优化 stop 功能
effect.spec.ts
```ts
import { extend } from "../shared";

/*
 * @Date: 2022-10-12 17:49:32
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-13 18:53:17
 */

// 保存effect
let activeEffect = void 0;
let shouldTrack = false;

class ReactiveEffect {
  private _fn: any;
  public deps = [];
  active = true;
  onStop?: () => void;
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }
  run() {
    // 运行 run 的时候，可以控制 要不要执行后续收集依赖的一步
    // 目前来看的话，只要执行了 fn 那么就默认执行了收集依赖
    // 这里就需要控制了

    // 是不是收集依赖的变量

    // 执行 fn  但是不收集依赖
    if (!this.active) {
      return this._fn();
    }

    // 执行 fn  收集依赖
    // 可以开始收集依赖了
    shouldTrack = true;

    // 执行的时候给全局的 activeEffect 赋值
    // 利用全局属性来获取当前的 effect
    activeEffect = this as any;
    // 执行用户传入的 fn
    const result = this._fn();
    // 重置
    shouldTrack = false;
    activeEffect = undefined;

    return result;
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}
function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}
const targetMap = new Map();
export function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    // targetMap 中没有以target为key 的值，所以新增一个map放进去
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    // 如果depsMap没有以key为key的值 所以新增一个set进去
    dep = new Set();
    depsMap.set(key, dep);
  }
  if (!activeEffect) return;
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    // 反向收集deps，帮助stop清空
    (activeEffect as any).deps.push(dep);
  }
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  // _effect.onStop = options.onStop; // 下面的写法更加优雅
  // Object.assign(_effect, options);
  extend(_effect, options);

  _effect.run();
  const runner: any = _effect.run.bind(_effect);
  // 保存依赖
  runner.effect = _effect;

  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}

```
effect.ts
```ts
import { extend } from "../shared";

/*
 * @Date: 2022-10-12 17:49:32
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-13 18:53:17
 */

// 保存effect
let activeEffect = void 0;
let shouldTrack = false;

class ReactiveEffect {
  private _fn: any;
  public deps = [];
  active = true;
  onStop?: () => void;
  constructor(fn, public scheduler?) {
    this._fn = fn;
  }
  run() {
    // 运行 run 的时候，可以控制 要不要执行后续收集依赖的一步
    // 目前来看的话，只要执行了 fn 那么就默认执行了收集依赖
    // 这里就需要控制了

    // 是不是收集依赖的变量

    // 执行 fn  但是不收集依赖
    if (!this.active) {
      return this._fn();
    }

    // 执行 fn  收集依赖
    // 可以开始收集依赖了
    shouldTrack = true;

    // 执行的时候给全局的 activeEffect 赋值
    // 利用全局属性来获取当前的 effect
    activeEffect = this as any;
    // 执行用户传入的 fn
    const result = this._fn();
    // 重置
    shouldTrack = false;
    activeEffect = undefined;

    return result;
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}
function cleanupEffect(effect) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}
const targetMap = new Map();
export function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    // targetMap 中没有以target为key 的值，所以新增一个map放进去
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    // 如果depsMap没有以key为key的值 所以新增一个set进去
    dep = new Set();
    depsMap.set(key, dep);
  }
  if (!activeEffect) return;
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    // 反向收集deps，帮助stop清空
    (activeEffect as any).deps.push(dep);
  }
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  // _effect.onStop = options.onStop; // 下面的写法更加优雅
  // Object.assign(_effect, options);
  extend(_effect, options);

  _effect.run();
  const runner: any = _effect.run.bind(_effect);
  // 保存依赖
  runner.effect = _effect;

  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}

```

## 第十三节实战课-实现 reactive 和 readonly 嵌套对象转换功能
baseHandlers.ts

```ts
/*
 * @Date: 2022-10-13 18:04:18
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-14 07:47:25
 */
import { isObject } from "../shared";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly } from "./reactive";

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    );
    return true;
  },
};

function createGetter(isReadonly = false) {
  return function get(target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);
    //新增嵌套 看看res 是不是 object
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    if (!isReadonly) {
      //  TODO 依赖收集
      track(target, key);
    }
    return res;
  };
}

function createSetter() {
  return function set(target, key, value) {
    const res = Reflect.set(target, key, value);
    //   TODO 触发依赖
    trigger(target, key);
    return res;
  };
}

```

readonly.spec.ts

```ts
import { isReadonly, readonly } from "../reactive";

/*
 * @Date: 2022-10-13 17:55:00
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-14 07:46:48
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

```
reactive.spec.ts

```ts
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

```


## 第十四节实战课-
## 第十五节实战课-
