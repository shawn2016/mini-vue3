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
