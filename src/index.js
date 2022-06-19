import { initGlobalAPI } from "./gloablApi";
import { initMixin } from "./init"
import { initLifeCycle } from "./lifecycle";
import { nextTick } from "./observe/wtacher";

function Vue(options) { // options就是用户的选项 包括 data,methods等
    this._init(options)
}
Vue.prototype.$nextTick = nextTick
initMixin(Vue); // 拓展了init方法  见原型上的方法拓展成一个个的函数 通过函数的方式在去原型上拓展功能
initLifeCycle(Vue);
initGlobalAPI(Vue)

// Vue.prototype.$watch = function(exprOrFn,cb,options) {
    
// }



export default Vue