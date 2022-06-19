import { initGlobalAPI } from "./gloablApi";
import { initMixin } from "./init"
import { initLifeCycle } from "./lifecycle";
import Watcher, { nextTick } from "./observe/wtacher";

function Vue(options) { // options就是用户的选项 包括 data,methods等
    this._init(options)
}
Vue.prototype.$nextTick = nextTick
initMixin(Vue); // 拓展了init方法  见原型上的方法拓展成一个个的函数 通过函数的方式在去原型上拓展功能
initLifeCycle(Vue);
initGlobalAPI(Vue)


// 最终watch调用的是这个
Vue.prototype.$watch = function(exprOrFn,cb,options = {}) {  
    // 核心就是 watcher监听的值发生了变化直接执行cb函数即可
   new Watcher(this,exprOrFn,{user:true},cb)
}



export default Vue