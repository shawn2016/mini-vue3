/*
 * @Date: 2022-10-14 17:50:02
 * @LastEditors: shawn
 * @LastEditTime: 2022-10-14 18:21:51
 */

import { hasChanged, isObject } from "../shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

export class RefImpl {
  private _value: any;
  private dep: Set<unknown>;
  private _rawValue: any;

  constructor(value) {
    // 如果传入的是对象的话 需要包裹成reactive
    // 判断是否是对象,如果是对象的话 下面object对比是会有问题的 所以需要一个_rawValue 保存原始对象
    this._rawValue = value;
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
    trackRefvalue(this);

    return this._value;
  }

  set value(newValue) {
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      this._value = convert(newValue);
      triggerEffects(this.dep);
    }
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

function trackRefvalue(ref) {
  if (isTracking()) {
    // 依赖收集
    trackEffects(ref.dep);
  }
}

export function ref(value) {
  return new RefImpl(value);
}

function createRef(value) {
  const refImpl = new RefImpl(value);

  return refImpl;
}
