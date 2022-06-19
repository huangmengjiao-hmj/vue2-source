// 创建元素 _c() h()
export function createElementVNode(vm,tag,data,...children) {
    if (data === null) {
        data = {}
    }
    let key = data.key
    if (key) {
        delete data.key
    }
    return vnode(vm,tag,key,data,children)
}

// _v
export function createTextVNode(vm,text) {
    return vnode(vm,undefined,undefined,undefined,undefined,text)
}

// ast做的是语法层面的转化 他描述的是语法本身 (描述的是js css html语言)
// render方法生成的虚拟DOM 描述的是DOM元素 可以增加一些自定义的属性 (描述的是DOM)
function vnode(vm,tag,key,data,children,text) {
    return {
        vm,
        tag,
        key,
        data,
        children,
        text
    }
}