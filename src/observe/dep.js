let id = 0;
class Dep{
    constructor(){
        this.id = id++; //属性的dep需要去收集watcher
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
        this.subs.push(watcher)
    }
    notify(){
        this.subs.forEach(watcher => watcher.update()); // 告诉watcher应该更新
    }
}

Dep.target = null;

// 维护一个栈型结构
let stack = []
export function pushStack(watcher) {
    stack.push(watcher)
    Dep.target = watcher
}
export function popStack() {
    stack.pop();
    Dep.target = stack[stack.length - 1]
}

export default Dep;