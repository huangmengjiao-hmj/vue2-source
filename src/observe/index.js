import { newArrayProto } from "./array";
import Dep from "./dep";

class Observe{
    constructor(data){

        // 给每个对象都增加收集
        this.dep = new Dep()

        // Object.defineProperty只能劫持已经存在的属性 (Vue里面会后增 删除的属性单独写一些api $set $delete)
        Object.defineProperty(data,'__ob__',{
            value:this,
            enumerable:false
        })
        // data.__ob__ = this // 给数据加了一个标识，如果数据上有__ob__，则表示该数据被观察过了
        if (Array.isArray(data)) {
            // 这里我们可以重写数组中的方法 7个变异方法 可以修改数组本身
            data.__proto__ = newArrayProto // 需要保留数组原有的特性，并且可以重写部分方法
            // this.observeArray(data) // 可以对数组中的对象进行劫持
        } else {
            this.walk(data)
        }
    }
    walk(data){ // 循环对象 对属性进行依次劫持
        // '重新定义'属性
        Object.keys(data).forEach(key => defineReactive(data,key,data[key]))
    }
    observeArray(data){ // 观察数组
        //遍历循环
        data.forEach(item => observe(item))
    }
}
// 深层次嵌套会递归，递归多了性能变差，不存在的属性监控不到 存在的属性重写方法 vue3使用的是proxy
function dependArray(value) {
    for (let i = 0; i < value.length; i++) {
        let current = value[i]
        current.__ob__&& current.__ob__.dep.depend();
        if (Array.isArray(current)) {
            dependArray(current)
        }
    }
}
export function defineReactive(target,key,value){ // 闭包 属性劫持 value可能是一个对象
    let childOb =  observe(value); // 对所有的对象都进行属性劫持 childOb.dep用来了收集依赖
    let dep = new Dep(); // 给每个属性都增加一个dep
    Object.defineProperty(target,key,{
        get(){ //取值的时候会执行get
            // console.log('key',key);
            if (Dep.target) {
                dep.depend(); // 让这个属性收集器记住当前的watcher
                if (childOb) {
                    childOb.dep.depend(); // 让数组和对象本身也收集依赖
                    if (Array.isArray(value)) {
                        dependArray(value)
                    }
                }
            }
            return value
        },
        set(newValue){ // 修改的时候会执行set
            if(newValue === value) return
            observe(newValue);
            value = newValue
            dep.notify(); // 通知更新
        },
    })

}
export function observe(data){
    // 对对象进行劫持
    if (typeof data !== 'object' || data === null) return; // 只对象进行劫持
    if(data.__ob__ instanceof Observe){ // 这个对象被代理过了
        return data.__ob__
    }
    // 如果一个对象被劫持过了，那就不惜要再被劫持了(要判断一个对象是否被劫持过，可以添加一个实例，通过实例来判断)
    return new Observe(data)
    // console.log(data);
}