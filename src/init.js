import { compileToFunction } from "./compiler/index"
import { callHook, mountComponent } from "./lifecycle"
import { initState } from "./state"
import { mergeOptions } from "./utils"

export function initMixin(Vue){ // 给Vue增加init的方法
    Vue.prototype._init = function (options){ // 在Vue的原型上定义初始化方法,data、methods
        // 以$开头的话 会被Vue识别为自己的属性
        // vue vm.$options 就是获取用户的配置
        const vm = this
        vm.$options = mergeOptions(this.constructor.options,options)  // 将用户的选项挂载到实例上  将用户选项和全局的选项进行合并
        // console.log(vm.$options);
        callHook(vm,'beforeCreate'); // 初始化之前执行beforeCreate
        // 初始化状态
        initState(vm)
        callHook(vm,'created'); // 初始化完成后执行创建函数
        if (options.el) {
            vm.$mount(options.el); // 实现数据的挂载
        }
    }
    Vue.prototype.$mount = function(el){
        const vm = this;
        el = document.querySelector(el); // 拿到当前的DOM元素
        let ops = vm.$options
        // render() > template >el
        if (!ops.render) { // 先查找有没有render函数
            let template; // 没有render则看一下是否写了template,没写template采用外部的template
            if (!ops.template && el) { // 没有写模板 但是写了el的话 就将el当成是模板
                template = el.outerHTML
            } else {
                if (el) {
                    template = ops.template // 如果有el 则采用模板的内容
                }
            }
            // 写了template 就用template
            if (template) {
                // 对template进行编译
                const render = compileToFunction(template)
                ops.render = render
            }
            // console.log(template);
        }
        // console.log(ops.render);
        //  ops.render; //最后就可以获取render方法
        
        mountComponent(vm,el); // 组件的挂载
        // 通过script 标签引用的vue.global.js 这个的编译过程是在浏览器运行的
        // runtime是不包含模板编译的，整个的编译是打包的时候通过loader来转义.vue文件 用runtime的时候不能使用template
    }
}