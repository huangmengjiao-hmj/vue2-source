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
]
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
    }
})
export function mergeOptions(parent,child) {
    const options = {}
    for (let key in parent) { // 对用户的options 老的进行循环
       mergeField(key)
    }
    for (const key in child) {
        if (!parent.hasOwnProperty(key)){
            mergeField(key)
        }
    }
    function mergeField(key) {
        // 策略模式 用策略模式节省if else
        if (strats[key]) {
            options[key]= strats[key](parent[key],child[key])
        }else {
            // 如果不在策略中以儿子为主
            options[key] = child[key] || parent[key]; // 优先采用儿子的，再采用父亲的 
        }
    }
    return options
}