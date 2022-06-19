import Watcher from "./observe/wtacher";
import { createElementVNode,createTextVNode } from "./vdom/index"


function createElm(vnode) {
    let {tag,data,children,text} = vnode; // 对 vnode进行解构
    if (typeof tag === 'string') { // 标签
        vnode.el = document.createElement(tag); //将真实节点和虚拟节点对应起来，后续可以查找虚拟节点所对应的真实节点进行属性修改  

        patchProps(vnode.el,data); // 给DOM增加属性
        children.forEach(child => {
            vnode.el.appendChild(createElm(child)) // 将子元素添加进父元素中
            
        }); 
    } else {
       vnode.el = document.createTextNode(text)
    }
    return vnode.el
}

function patchProps(el,props) {
    for (const key in props) {
        if(key === 'style'){
            for (const styleName in props.style) {
               el.style[styleName] = props.style[styleName]
            }
        } else {

            el.setAttribute(key,props[key])
        }
    }
}

function patch(oldVNode,vnode) {
    // 初渲染 对oldVNode进行判断
    const isRealElement = oldVNode.nodeType;
    if (isRealElement) {
        const elm = oldVNode // 获取真实元素
        const parentElement = elm.parentNode  // 拿到父元素
        let newElement = createElm(vnode); // 创建出真实的DOM
        // 将新的元素追加进去
        parentElement.insertBefore(newElement,elm.nextSibling)
        parentElement.removeChild(elm) // 删除老的元素
        // console.log(newElement);

        return newElement
        
    } else {
        // 更新 diff算法
    }
    
}

export function initLifeCycle(Vue) {
    // _c('div',{},children)
    Vue.prototype._c = function(){
        return createElementVNode(this,...arguments)
    }
    // _v(text)
    Vue.prototype._v = function(){
        return createTextVNode(this,...arguments)

    }
    Vue.prototype._s = function(value){
        if (typeof value !== 'object') return value
        return JSON.stringify(value)
    }
    Vue.prototype._render = function(){
        // 当渲染的时候会去实例中取值，我们就可以将属性和视图绑定在一起
        const vm = this
        // 直接return render生成虚拟DOM 让with上的this指向vm
        return vm.$options.render.call(vm); // 这里的render是之前通过ast语法树转义后生成的render方法
    }
    Vue.prototype._update = function(vnode){ // 将vnode转化成真实DOM
        const vm = this;
        const el = vm.$el
        // console.log(vm,el);
        // console.log("update",vnode);
        // patch既有初始化的功能又有更新的功能
        vm.$el = patch(el,vnode)
    }
}

export function mountComponent(vm,el) {

    vm.$el = el; // 将el挂载在实例上 这里的el是经过querySelector处理过的
    // 1.调用render方法生成虚拟DOM
    //  vm._render(); // 源码中调用的是_render()方法 实际上就是vm.$options.render()
    const updateComponent = () => {
         vm._update(vm._render()); //_update()就是将虚拟节点变成真实节点
     }
     new Watcher(vm,updateComponent,true); // true用于标识是一个渲染watcher
    // 2.根据虚拟DOM产生真实的DOM
    // 3.插入到el元素中


}


// vue的核心流程 1) 创造了响应式数据 2) 模板转换成ast语法树 
//3) 将ast语法树转换成了render函数 4)后续数据更新只执行render函数(无需再次执行ast转化过程)
// render函数会产生虚拟节点(使用响应式数据 => 数据驱动)
// 根据生成的虚拟节点创造出真实的DOM


export function callHook(vm,hook) { // 调用钩子函数
    const handlers = vm.$options[hook];
    if (handlers&&handlers.length > 0) {
        handlers.forEach(handler => handler.call(vm))
    }
}