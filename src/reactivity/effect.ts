import { extend } from "../shared";

/*
 * @Date: 2022-10-12 17:49:32
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-14 18:07:39
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
  trackEffects(dep);
}

export function trackEffects(dep) {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    // 反向收集deps，帮助stop清空
    (activeEffect as any).deps.push(dep);
  }
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  triggerEffects(dep);
}
export function triggerEffects(dep) {
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
