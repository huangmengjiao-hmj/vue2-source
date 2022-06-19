// 将vm._update(vm._render())封装成为一个watcher

import Dep, { popStack, pushStack } from "./dep";

/**
 * 组件化的好处：复用性强、方便维护、局部渲染提高性能
 */

let id = 0 ; // 记录每次创建的watcher

/**
 * 1) 当我们创建渲染watcher的时候，我们会把当前的渲染watcher放在Dep.target上
 * 2) 调用_render会取值 走到watcher的get上
 */

// 每个属性有dep 每个属性就是一个被观察者 watcher是一个观察者 当属性改变会通知watcher去更新
class Watcher{ // 不同组件有不同的watcher
    constructor(vm,exprOrFn,options,cb){ //fn代表的是渲染的方法
        this.id = id++; // 将id作为每一个watcher的唯一标识
        this.renderWatcher = options; // options 代表是否为一个渲染Watcher
        if (typeof exprOrFn === 'string') {
            this.getter = function () {
                return vm[exprOrFn]
            }
        }else {

            this.getter = exprOrFn; // getter意味着调用这个函数可以发生取值
        }
        this.deps=[];// 计算属性
        this.vm = vm
        this.cb = cb
        this.depsId = new Set()
        this.lazy = options.lazy
        this.dirty = this.lazy; // 缓存值
        this.value = this.lazy?undefined : this.get()
        this.user  = options.user; // 标识是否是用户自己的watch
    }
    evaluate(){
        this.value =  this.get(); // 获取到用户的函数返回值 并且标识为脏
        this.dirty = false
    }
    get(){
        pushStack(this)
        // Dep.target = this; // 给Dep类上增添了一个静态属性(只有一份)
        let value = this.getter.call(this.vm) // 会在vm上取值 
        // Dep.target = null; // 渲染完毕后就清空
        popStack();
        return value
    }
    addDep(dep){ // 一个组件对应多个属性 重复属性不用记录
       let id = dep.id
       if (!this.depsId.has(id)) {
           this.deps.push(dep) 
           this.depsId.add(id) 
           dep.addSub(this) //此时watcher已经记住了dep了同时去重了，此时dep也记住了watcher
       }
    }
    depend(){
        let i = this.deps.length 
        while (i--) {
            this.deps[i].depend(); //让计算属性watcher也收集渲染watcher
        }
    }
    update(){
        // this.get() // 重新更新渲染 这样会立即更新 性能消耗太大
        if(this.lazy){ 
            // 如果是计算属性 当依赖的值发生了变化 就标识计算属性是脏值
            this.dirty = true

        } else {

            queueWatcher(this) // 将当前的watcher传进去
        }
    }
    run(){
        let oldValue = this.value
        let newValue = this.get()
        if (this.user) {
            this.cb.call(this.vm,newValue,oldValue)
        }
    }
}
function flashSchedulerQueue(){
    let flashQueue = queue.slice(0)
    queue = []
    has = {}
    pending = false
    flashQueue.forEach(q => q.run()) // 在刷新的过程中可能还有新的watcher 重新放到queue中
}
let queue = []
let has = {}
let pending = false; // 防抖
function queueWatcher(watcher){
    const id =watcher.id
    if (!(has[id])) {
        queue.push(watcher)
        has[id] = true
        // 不管update执行多少次 但只执行一轮刷新操作
        if (!pending) {  // 只会被执行一次
            nextTick(flashSchedulerQueue)
            pending = true
        }
    }
}
let callbacks = [];
let waiting = false

function flashCallbacks(){
    let flashCallBack = callbacks.slice(0);
    callbacks = []
    waiting = false
    flashCallBack.forEach(cb => cb()); // 按照顺序执行
}

// nextTick 源码中没有直接使用哪个api也没有使用定时器 而是采用了优雅降级的方法
/**
 * 优雅降级的方式
 *  vue2内部先采用 promise（ie不兼容） MutationObserver H5的api  可以考虑ie专享的 setImmeduate  setTimeout
 */ 
let timerFunc;
if (Promise) {
    timerFunc= () => {
        Promise.resolve().then(flashCallbacks); // vue3中直接采用的是这种方法
    }
} else if(MutationObserver){
    let observe = new MutationObserver(flashCallbacks); // 这里的传入是异步执行的
    let textNode = document.createTextNode(1)
    observe.observe(textNode,{
        characterData:true
    })
    timerFunc = () => {
        textNode.textContent = 2
    }
} else if(setImmediate){
    timerFunc = () => {
        setImmediate(flashCallbacks)
    }
}else {
    timerFunc = () => {
        setTimeout(() => {
        flashCallbacks()
    },0)
}
}
// 刷新使用定时器是一部操作 将任务放进队列中是同步
export function nextTick(cb){
    callbacks.push(cb); // 维护nextTick中的callback方法  
    if (!waiting) {
        timerFunc() // 最后一起刷新
        waiting = true
    }
}

// 需要给每个属性增加一个dep，目的就是收集watcher
// n个属性会对应一个视图 n个dep对应一个watcher
// 1个属性对应着多个组件 1个dep对应多个watcher

export default Watcher