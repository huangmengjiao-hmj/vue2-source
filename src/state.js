import Dep from "./observe/dep";
import { observe } from "./observe/index";
import Watcher from "./observe/wtacher";

export function initState(vm) {
    const opts = vm.$options; // 获取到所有的选项
    if (opts.data) {
        initData(vm); //初始化数据
    }
    if (opts.computed) {
        initComputed(vm)
    }
    if(opts.watch){
        initWatch(vm)
    }

}
function initWatch(vm) {
    let watch = vm.$options.watch;
    // console.log(watch);
    for (let key in watch) {
        const handler = watch[key]; // handler 可能是函数 数组 字符串
        if (Array.isArray(handler)) {
            for (let i = 0; i < handler.length; i++) {
                createWatcher(vm,key,handler[i])
            }
        }else {
            createWatcher(vm,key,handler)
        }
    }
}
function createWatcher(vm,key,handler) {
   // handler 可能是函数字符串 
   if (typeof handler === "string") {
    handler = vm[handler];
   }
   return vm.$watch(key,handler)
}

function proxy(vm, target, key) {
    Object.defineProperty(vm, key, {
        get() {
            return vm[target][key]
        },
        set(newValue) {
            if (vm[target][key] === newValue) return
            vm[target][key] = newValue
        }
    })
}
function initData(vm) {
    let data = vm.$options.data; // data 可能是函数或对象
    data = typeof data === 'function' ? data.call(vm) : data
    vm._data = data
    // 拿到数据之后需要对数据进行劫持 vue2中采用了一个api defineProperty
    observe(data)

    // 将vm._data用vm来代理
    for (const key in data) {
        proxy(vm, '_data', key)
    }

}
function initComputed(vm) {
    // debugger
    const computed = vm.$options.computed
    let watchers = vm._computedWatchers = {}; // 将计算属性的watcher挂载到vm上
    for (let key in computed) {
        // computed[key] 有可能是一个函数 也有可能是一个对象
        let userDef = computed[key]
        // 需要监控计算属性中get的变化
        let fn = typeof userDef === 'function'? userDef: userDef.get
        // 如果直接new watcher会立即执行fn 将属性和watcher对应起来
        watchers[key] = new Watcher(vm,fn,{lazy:true})
        // const getter = typeof userDef === 'function'? userDef: userDef.get
        // const setter =  userDef.set || (() => {})
        defineComputed(vm, key, userDef)
    }
}
function defineComputed(target, key, userDef) {
    // const getter = typeof userDef === 'function' ? userDef : userDef.get
    const setter = userDef.set || (() => { })
    // 可以通过实例拿到对应的属性
    Object.defineProperty(target, key, {
        get:createComputedGetter(key),
        set:setter
    })
}

// Vue2中 计算属性根本就不会去收集依赖，只会让自己的依赖属性去收集依赖
function createComputedGetter(key) {
    // 我们要检测是否要执行这个getter
    return function () {
       const watcher = this._computedWatchers[key]; // 获取到对应属性的watcher
       if (watcher.dirty) {
        //    debugger
           // 如果是脏的就去执行 用户传入的函数
           watcher.evaluate(); // 求值后dirty变为了false，下次就不需要再次求值
       }
       if (Dep.target) { // 计算属性出栈后，还要渲染watcher 应该让计算属性watcher里面的属性也去收集上层watcher
           watcher.depend();
       }
       return watcher.value; //最后返回的是watcher上
    }
}