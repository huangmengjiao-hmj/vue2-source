(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    const strats = {};
    const LIFECYCLE = [
        'beforeCreate',
        'created',
        'beforeMounte',
        'mounted',
        'beforeUpdate',
        'updated',
        'beforeDestroy',
        'destroyed'
    ];
    LIFECYCLE.forEach(hook => {
         /**
         * {} {created:function(){}} => {created:[fn]}
         * {created:function(){}} {created:[fn]} => {created:[fn,fn]}
        */
        strats[hook] = function(p,c) {
            if(c){
                if (p) {
                    return p.concat(c)
                } else {
                    return [c]
                }
            } else {
                return p
            }
        };
    });
    function mergeOptions(parent,child) {
        const options = {};
        for (let key in parent) { // 对用户的options 老的进行循环
           mergeField(key);
        }
        for (const key in child) {
            if (!parent.hasOwnProperty(key)){
                mergeField(key);
            }
        }
        function mergeField(key) {
            // 策略模式 用策略模式节省if else
            if (strats[key]) {
                options[key]= strats[key](parent[key],child[key]);
            }else {
                // 如果不在策略中以儿子为主
                options[key] = child[key] || parent[key]; // 优先采用儿子的，再采用父亲的 
            }
        }
        return options
    }

    function initGlobalAPI(Vue) {
        // 静态方法
    Vue.options = {};
    Vue.mixin = function (mixin) {
        // 我们期望将用户的选项和全局的options 进行合并
       this.options = mergeOptions(this.options,mixin);
       return this
    };
    }

    const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
    const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
    const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配到的是一个标签名 <div 匹配到的是开始标签
    const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配的是</xxx> 最终匹配到的是结束标签
    const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性
    // 第一个分组是属性的key value 就是分组3/4/5
    const startTagClose = /^\s*(\/?)>/; // <div> <br />

    // vue3中没有采用正则

    // 对模板进行编译处理

    function parseHTML(html) { // html最开始肯定是一个<
        // 最终需要转化成一颗抽象语法树
        const ELEMENT_TYPE = 1;
        const TEXT_TYPE = 3;
        const stack = []; // 用于存放元素的
        let currentParent; // 指向栈中的最后一个
        let root; // 根节点

        function createASTElment(tag,attrs) {
            return {
                tag,
                type:ELEMENT_TYPE,
                children:[],
                attrs,
                parent:null
            }
        }

        // 利用栈型结构来构造一棵树
        function start(tag,attrs) {
           let node = createASTElment(tag,attrs); // 创造一个ast节点
           if (!root) { // 看一下是否为空树
               root = node; // 为空 则第一个是当前节点的根节点
           }
           if (currentParent) {
               node.parent = currentParent; 
               currentParent.children.push(node);
           }
           stack.push(node);
           currentParent = node; 
            // console.log(stack,currentParent,'开始');
        }
        function chars(text) {
            text = text.replace(/\s/g,'');
            text &&currentParent.children.push({  // 文本直接放到当前指向的节点中
                type:TEXT_TYPE,
                text,
                parent:currentParent
            });
            
        }
        function end(tag) {
            stack.pop(); // 弹出最后一个
            // console.log(stack);
           currentParent = stack[stack.length -1];
            
        }
        function advance(n) {
            html = html.substring(n);
        }
        function parseStartTag() {
            const start = html.match(startTagOpen);
            if (start) {
                const match = {
                    tagName:start[1], // 标签名
                    attrs:[], // 属性
                };
                advance(start[0].length);
                // console.log(match,html);
                // 如果不是开始标签的结束 那就一直匹配下去
                let attr,end;
                // 如果没有匹配到开始标签结束 同时 属性一直有
                while (!(end =html.match(startTagClose)) && (attr = html.match(attribute))) {
                    // debugger
                    advance(attr[0].length);
                    match.attrs.push({
                        name:attr[1],
                        value:attr[3]||attr[4]||attr[5] || true
                    });
                }
                if (end) {
                    advance(end[0].length);  
                }
                return match
                // console.log(match);
            }
            return false
        }
        while(html){
            // debugger
            // 如果textEnd为0 说明是一个开始标签或者结束标签
            // 如果textEnd >0 说明就是文本结束的位置
            let textEnd= html.indexOf('<'); // 如果indexOf中的索引是0 则说明是一个标签
            if (textEnd === 0) {
                const startTagMatch = parseStartTag();
                if (startTagMatch) {
                    start(startTagMatch.tagName,startTagMatch.attrs);
                    continue;
                }
                let endTagMatch = html.match(endTag);
                if(endTagMatch){
                    end(endTagMatch[1]);
                    advance(endTagMatch[0].length);
                    continue;
                }
            }
            if (textEnd > 0) {
                let text = html.substring(0,textEnd); // 文本的内容
                if (text) {
                    chars(text);
                    advance(text.length);
                }
                
            }
        }
        // console.log(root);
        return root
    }

    function genProps(attrs) {
        // console.log(attrs);
        let str = ''; // 格式为{name,value}
        for (let i = 0; i < attrs.length; i++) {
            let attr = attrs[i];
            if (attr.name === 'style') {
                // color:red  => {color:red}
                let obj = {};
                attr.value.split(";").forEach(item => {
                    let [key,value] = item.split(":");
                    obj[key] = value;
                });
                attr.value = obj;
            }
            str += `${attr.name}:${JSON.stringify(attr.value)},`;
        }
        return `{${str.slice(0,-1)}}`
        
    }
    const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{abcd}} 匹配到的内容就是我们表达式的内容
    function gen(node) {
        if (node.type === 1) {
            // 元素
            return codegen(node)
        } else {
            // 文本
            let text = node.text;
            if (defaultTagRE.test(text)) {
                // 将{{hello}}hello 这样的格式处理成_s(hello)+'hello' 
                let tokens = [];
                let match;
                defaultTagRE.lastIndex = 0;
                let lastIndex = 0;
                while (match=defaultTagRE.exec(text)) {
                    let index = match.index;
                    if (index > lastIndex) {
                        tokens.push(JSON.stringify(text.slice(lastIndex,index)));
                    }
                    tokens.push(`_s(${match[1].trim()})`);
                    lastIndex = index+match[0].length;
                    // console.log(index,"77");
                    
                }
                if (lastIndex < text.length) {
                    tokens.push(JSON.stringify(text.slice(lastIndex)));
                }
                return `_v(${tokens.join('+')})`
                
            }else {
                return `_v(${JSON.stringify(text)})`
            }
            
        }
        
    }
    function genChildren(children) {
        if (children) {
            return children.map(child => gen(child)).join(",")
        }
    }

    function codegen(ast) {
        let children = genChildren(ast.children);
        let code = (`_c('${ast.tag}',${ast.attrs.length> 0 ? genProps(ast.attrs):'null'}${ast.children.length>0 ?`,${children}`:""})`);
        return code
    }

    // 模板引擎的实现原理 with + new Function
    function compileToFunction(template){
        // 1、就是将template转化成ast语法树
        let ast = parseHTML(template);
        // console.log(ast);
        // 2、生成render方法(render方法执行后的结果就是虚拟DOM)
        let code = codegen(ast);
        code = `with(this) {return ${code}}`;
        let render = new Function(code); // 根据code生成render函数
        // console.log(render.toString());
        // function render() {
        //     with(this) {return _c('div',{id:"app",style:{"color":" red","background":" yellow"}},_c('div',{style:{"color":" red"}},_v(_s(name)+"hello"+_s(name)+"red")),_c('span',null,_v(_s(age))))}
        // }
        return render
    }

    let id$1 = 0;
    class Dep{
        constructor(){
            this.id = id$1++; //属性的dep需要去收集watcher
            this.subs=[]; //当前属性对应的watcher有哪些
        }
        depend(){
            // 不希望收集重复的watcher 
            // this.subs.push(Dep.target) // 会重复收集 
            // 让watcher记住dep
            Dep.target.addDep(this); // Dep.target 指向的是watcher
            /**
             * dep 和 watcher是一个多对多的关系（一个属性可以在多个组件中使用 deep-> 多个watcher）
             * 一个组件中由多个属性组成（一个watcher对应多个dep）
             */
        }
        addSub(watcher){
            this.subs.push(watcher);
        }
        notify(){
            this.subs.forEach(watcher => watcher.update()); // 告诉watcher应该更新
        }
    }

    Dep.target = null;

    // 维护一个栈型结构
    let stack = [];
    function pushStack(watcher) {
        stack.push(watcher);
        Dep.target = watcher;
    }
    function popStack() {
        stack.pop();
        Dep.target = stack[stack.length - 1];
    }

    // 将vm._update(vm._render())封装成为一个watcher

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
        constructor(vm,fn,options){ //fn代表的是渲染的方法
            this.id = id++; // 将id作为每一个watcher的唯一标识
            this.renderWatcher = options; // options 代表是否为一个渲染Watcher
            this.getter = fn; // getter意味着调用这个函数可以发生取值
            this.deps=[];// 计算属性
            this.vm = vm;
            this.depsId = new Set();
            this.lazy = options.lazy;
            this.dirty = this.lazy; // 缓存值
            this.lazy?undefined : this.get();
            
        }
        evaluate(){
            this.value =  this.get(); // 获取到用户的函数返回值 并且标识为脏
            this.dirty = false;
        }
        get(){
            pushStack(this);
            // Dep.target = this; // 给Dep类上增添了一个静态属性(只有一份)
            let value = this.getter.call(this.vm); // 会在vm上取值 
            // Dep.target = null; // 渲染完毕后就清空
            popStack();
            return value
        }
        addDep(dep){ // 一个组件对应多个属性 重复属性不用记录
           let id = dep.id;
           if (!this.depsId.has(id)) {
               this.deps.push(dep); 
               this.depsId.add(id); 
               dep.addSub(this); //此时watcher已经记住了dep了同时去重了，此时dep也记住了watcher
           }
        }
        depend(){
            let i = this.deps.length; 
            while (i--) {
                this.deps[i].depend(); //让计算属性watcher也收集渲染watcher
            }
        }
        update(){
            // this.get() // 重新更新渲染 这样会立即更新 性能消耗太大
            if(this.lazy){ 
                // 如果是计算属性 当依赖的值发生了变化 就标识计算属性是脏值
                this.dirty = true;

            } else {

                queueWatcher(this); // 将当前的watcher传进去
            }
        }
        run(){
            this.get();
        }
    }
    function flashSchedulerQueue(){
        let flashQueue = queue.slice(0);
        queue = [];
        has = {};
        pending = false;
        flashQueue.forEach(q => q.run()); // 在刷新的过程中可能还有新的watcher 重新放到queue中
    }
    let queue = [];
    let has = {};
    let pending = false; // 防抖
    function queueWatcher(watcher){
        const id =watcher.id;
        if (!(has[id])) {
            queue.push(watcher);
            has[id] = true;
            // 不管update执行多少次 但只执行一轮刷新操作
            if (!pending) {  // 只会被执行一次
                nextTick(flashSchedulerQueue);
                pending = true;
            }
        }
    }
    let callbacks = [];
    let waiting = false;

    function flashCallbacks(){
        let flashCallBack = callbacks.slice(0);
        callbacks = [];
        waiting = false;
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
        };
    } else if(MutationObserver){
        let observe = new MutationObserver(flashCallbacks); // 这里的传入是异步执行的
        let textNode = document.createTextNode(1);
        observe.observe(textNode,{
            characterData:true
        });
        timerFunc = () => {
            textNode.textContent = 2;
        };
    } else if(setImmediate){
        timerFunc = () => {
            setImmediate(flashCallbacks);
        };
    }else {
        timerFunc = () => {
            setTimeout(() => {
            flashCallbacks();
        },0);
    };
    }
    // 刷新使用定时器是一部操作 将任务放进队列中是同步
    function nextTick(cb){
        callbacks.push(cb); // 维护nextTick中的callback方法  
        if (!waiting) {
            timerFunc(); // 最后一起刷新
            waiting = true;
        }
    }

    // 创建元素 _c() h()
    function createElementVNode(vm,tag,data,...children) {
        if (data === null) {
            data = {};
        }
        let key = data.key;
        if (key) {
            delete data.key;
        }
        return vnode(vm,tag,key,data,children)
    }

    // _v
    function createTextVNode(vm,text) {
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

    function createElm(vnode) {
        let {tag,data,children,text} = vnode; // 对 vnode进行解构
        if (typeof tag === 'string') { // 标签
            vnode.el = document.createElement(tag); //将真实节点和虚拟节点对应起来，后续可以查找虚拟节点所对应的真实节点进行属性修改  

            patchProps(vnode.el,data); // 给DOM增加属性
            children.forEach(child => {
                vnode.el.appendChild(createElm(child)); // 将子元素添加进父元素中
                
            }); 
        } else {
           vnode.el = document.createTextNode(text);
        }
        return vnode.el
    }

    function patchProps(el,props) {
        for (const key in props) {
            if(key === 'style'){
                for (const styleName in props.style) {
                   el.style[styleName] = props.style[styleName];
                }
            } else {

                el.setAttribute(key,props[key]);
            }
        }
    }

    function patch(oldVNode,vnode) {
        // 初渲染 对oldVNode进行判断
        const isRealElement = oldVNode.nodeType;
        if (isRealElement) {
            const elm = oldVNode; // 获取真实元素
            const parentElement = elm.parentNode;  // 拿到父元素
            let newElement = createElm(vnode); // 创建出真实的DOM
            // 将新的元素追加进去
            parentElement.insertBefore(newElement,elm.nextSibling);
            parentElement.removeChild(elm); // 删除老的元素
            // console.log(newElement);

            return newElement
            
        }
        
    }

    function initLifeCycle(Vue) {
        // _c('div',{},children)
        Vue.prototype._c = function(){
            return createElementVNode(this,...arguments)
        };
        // _v(text)
        Vue.prototype._v = function(){
            return createTextVNode(this,...arguments)

        };
        Vue.prototype._s = function(value){
            if (typeof value !== 'object') return value
            return JSON.stringify(value)
        };
        Vue.prototype._render = function(){
            // 当渲染的时候会去实例中取值，我们就可以将属性和视图绑定在一起
            const vm = this;
            // 直接return render生成虚拟DOM 让with上的this指向vm
            return vm.$options.render.call(vm); // 这里的render是之前通过ast语法树转义后生成的render方法
        };
        Vue.prototype._update = function(vnode){ // 将vnode转化成真实DOM
            const vm = this;
            const el = vm.$el;
            // console.log(vm,el);
            // console.log("update",vnode);
            // patch既有初始化的功能又有更新的功能
            vm.$el = patch(el,vnode);
        };
    }

    function mountComponent(vm,el) {

        vm.$el = el; // 将el挂载在实例上 这里的el是经过querySelector处理过的
        // 1.调用render方法生成虚拟DOM
        //  vm._render(); // 源码中调用的是_render()方法 实际上就是vm.$options.render()
        const updateComponent = () => {
             vm._update(vm._render()); //_update()就是将虚拟节点变成真实节点
         };
         new Watcher(vm,updateComponent,true); // true用于标识是一个渲染watcher
        // 2.根据虚拟DOM产生真实的DOM
        // 3.插入到el元素中


    }


    // vue的核心流程 1) 创造了响应式数据 2) 模板转换成ast语法树 
    //3) 将ast语法树转换成了render函数 4)后续数据更新只执行render函数(无需再次执行ast转化过程)
    // render函数会产生虚拟节点(使用响应式数据 => 数据驱动)
    // 根据生成的虚拟节点创造出真实的DOM


    function callHook(vm,hook) { // 调用钩子函数
        const handlers = vm.$options[hook];
        if (handlers&&handlers.length > 0) {
            handlers.forEach(handler => handler.call(vm));
        }
    }

    // 我们 希望重写数组中的部分方法
    let oldArrayProtp = Array.prototype; // 获取数组的原型

    // newArrayProto.__proto__ = oldArrayProtp
    let newArrayProto = Object.create(oldArrayProtp);
    let methods = [ // 找到所有的变异方法(能够修改原数组的方法)
      'push',
      "pop",
      "shift",
      "unshift",
      "reverse",
      "sort",
      "splice"
    ];// concat slice 都不会改变原来的数组

    methods.forEach(method => {
        newArrayProto[method] = function(...args){ // 重写数组的方法
            // push()
            const result = oldArrayProtp[method].call(this,...args); // 内部调用原来的方法 函数的方式进行劫持 切片编程

            // 我们需要都再次新增的属性进行劫持
            let inserted;
            let ob = this.__ob__;
            switch (method) {
                case 'push':
                case 'unshift': // ...args都是新增的值  
                inserted = args;   
                    break;
                case 'splice':
                    inserted = args.slice(2);
                    break;
            }
            // console.log(inserted); // inserted 是一个数组
            if (inserted) { // 对新增的内容再次进行观测
                ob.observeArray(inserted);
                // console.log('更新');
            }
            ob.dep.notify(); // 数组变化了 通知对应的watcher实现更新
            // console.log('method',method);
            return result
        };
    });

    class Observe{
        constructor(data){

            // 给每个对象都增加收集
            this.dep = new Dep();

            // Object.defineProperty只能劫持已经存在的属性 (Vue里面会后增 删除的属性单独写一些api $set $delete)
            Object.defineProperty(data,'__ob__',{
                value:this,
                enumerable:false
            });
            // data.__ob__ = this // 给数据加了一个标识，如果数据上有__ob__，则表示该数据被观察过了
            if (Array.isArray(data)) {
                // 这里我们可以重写数组中的方法 7个变异方法 可以修改数组本身
                data.__proto__ = newArrayProto; // 需要保留数组原有的特性，并且可以重写部分方法
                // this.observeArray(data) // 可以对数组中的对象进行劫持
            } else {
                this.walk(data);
            }
        }
        walk(data){ // 循环对象 对属性进行依次劫持
            // '重新定义'属性
            Object.keys(data).forEach(key => defineReactive(data,key,data[key]));
        }
        observeArray(data){ // 观察数组
            //遍历循环
            data.forEach(item => observe(item));
        }
    }
    // 深层次嵌套会递归，递归多了性能变差，不存在的属性监控不到 存在的属性重写方法 vue3使用的是proxy
    function dependArray(value) {
        for (let i = 0; i < value.length; i++) {
            let current = value[i];
            current.__ob__&& current.__ob__.dep.depend();
            if (Array.isArray(current)) {
                dependArray(current);
            }
        }
    }
    function defineReactive(target,key,value){ // 闭包 属性劫持 value可能是一个对象
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
                            dependArray(value);
                        }
                    }
                }
                return value
            },
            set(newValue){ // 修改的时候会执行set
                if(newValue === value) return
                observe(newValue);
                value = newValue;
                dep.notify(); // 通知更新
            },
        });

    }
    function observe(data){
        // 对对象进行劫持
        if (typeof data !== 'object' || data === null) return; // 只对象进行劫持
        if(data.__ob__ instanceof Observe){ // 这个对象被代理过了
            return data.__ob__
        }
        // 如果一个对象被劫持过了，那就不惜要再被劫持了(要判断一个对象是否被劫持过，可以添加一个实例，通过实例来判断)
        return new Observe(data)
        // console.log(data);
    }

    function initState(vm) {
        const opts = vm.$options; // 获取到所有的选项
        if (opts.data) {
            initData(vm); //初始化数据
        }
        if (opts.computed) {
            initComputed(vm);
        }

    }
    function proxy(vm, target, key) {
        Object.defineProperty(vm, key, {
            get() {
                return vm[target][key]
            },
            set(newValue) {
                if (vm[target][key] === newValue) return
                vm[target][key] = newValue;
            }
        });
    }
    function initData(vm) {
        let data = vm.$options.data; // data 可能是函数或对象
        data = typeof data === 'function' ? data.call(vm) : data;
        vm._data = data;
        // 拿到数据之后需要对数据进行劫持 vue2中采用了一个api defineProperty
        observe(data);

        // 将vm._data用vm来代理
        for (const key in data) {
            proxy(vm, '_data', key);
        }

    }
    function initComputed(vm) {
        // debugger
        const computed = vm.$options.computed;
        let watchers = vm._computedWatchers = {}; // 将计算属性的watcher挂载到vm上
        for (let key in computed) {
            // computed[key] 有可能是一个函数 也有可能是一个对象
            let userDef = computed[key];
            // 需要监控计算属性中get的变化
            let fn = typeof userDef === 'function'? userDef: userDef.get;
            // 如果直接new watcher会立即执行fn 将属性和watcher对应起来
            watchers[key] = new Watcher(vm,fn,{lazy:true});
            // const getter = typeof userDef === 'function'? userDef: userDef.get
            // const setter =  userDef.set || (() => {})
            defineComputed(vm, key, userDef);
        }
    }
    function defineComputed(target, key, userDef) {
        // const getter = typeof userDef === 'function' ? userDef : userDef.get
        const setter = userDef.set || (() => { });
        // 可以通过实例拿到对应的属性
        Object.defineProperty(target, key, {
            get:createComputedGetter(key),
            set:setter
        });
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

    function initMixin(Vue){ // 给Vue增加init的方法
        Vue.prototype._init = function (options){ // 在Vue的原型上定义初始化方法,data、methods
            // 以$开头的话 会被Vue识别为自己的属性
            // vue vm.$options 就是获取用户的配置
            const vm = this;
            vm.$options = mergeOptions(this.constructor.options,options);  // 将用户的选项挂载到实例上  将用户选项和全局的选项进行合并
            // console.log(vm.$options);
            callHook(vm,'beforeCreate'); // 初始化之前执行beforeCreate
            // 初始化状态
            initState(vm);
            callHook(vm,'created'); // 初始化完成后执行创建函数
            if (options.el) {
                vm.$mount(options.el); // 实现数据的挂载
            }
        };
        Vue.prototype.$mount = function(el){
            const vm = this;
            el = document.querySelector(el); // 拿到当前的DOM元素
            let ops = vm.$options;
            // render() > template >el
            if (!ops.render) { // 先查找有没有render函数
                let template; // 没有render则看一下是否写了template,没写template采用外部的template
                if (!ops.template && el) { // 没有写模板 但是写了el的话 就将el当成是模板
                    template = el.outerHTML;
                } else {
                    if (el) {
                        template = ops.template; // 如果有el 则采用模板的内容
                    }
                }
                // 写了template 就用template
                if (template) {
                    // 对template进行编译
                    const render = compileToFunction(template);
                    ops.render = render;
                }
                // console.log(template);
            }
            // console.log(ops.render);
            //  ops.render; //最后就可以获取render方法
            
            mountComponent(vm,el); // 组件的挂载
            // 通过script 标签引用的vue.global.js 这个的编译过程是在浏览器运行的
            // runtime是不包含模板编译的，整个的编译是打包的时候通过loader来转义.vue文件 用runtime的时候不能使用template
        };
    }

    function Vue(options) { // options就是用户的选项 包括 data,methods等
        this._init(options);
    }
    Vue.prototype.$nextTick = nextTick;
    initMixin(Vue); // 拓展了init方法  见原型上的方法拓展成一个个的函数 通过函数的方式在去原型上拓展功能
    initLifeCycle(Vue);
    initGlobalAPI(Vue);

    return Vue;

}));
//# sourceMappingURL=vue.js.map
