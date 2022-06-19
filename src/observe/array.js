// 我们 希望重写数组中的部分方法
let oldArrayProtp = Array.prototype; // 获取数组的原型

// newArrayProto.__proto__ = oldArrayProtp
export let newArrayProto = Object.create(oldArrayProtp);
let methods = [ // 找到所有的变异方法(能够修改原数组的方法)
  'push',
  "pop",
  "shift",
  "unshift",
  "reverse",
  "sort",
  "splice"
]// concat slice 都不会改变原来的数组

methods.forEach(method => {
    newArrayProto[method] = function(...args){ // 重写数组的方法
        // push()
        const result = oldArrayProtp[method].call(this,...args) // 内部调用原来的方法 函数的方式进行劫持 切片编程

        // 我们需要都再次新增的属性进行劫持
        let inserted;
        let ob = this.__ob__;
        switch (method) {
            case 'push':
            case 'unshift': // ...args都是新增的值  
            inserted = args   
                break;
            case 'splice':
                inserted = args.slice(2)
                break;
            default:
                break;
        }
        // console.log(inserted); // inserted 是一个数组
        if (inserted) { // 对新增的内容再次进行观测
            ob.observeArray(inserted)
            // console.log('更新');
        }
        ob.dep.notify(); // 数组变化了 通知对应的watcher实现更新
        // console.log('method',method);
        return result
    }
})