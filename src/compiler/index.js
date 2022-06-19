import { parseHTML } from "./parse";

function genProps(attrs) {
    // console.log(attrs);
    let str = '' // 格式为{name,value}
    for (let i = 0; i < attrs.length; i++) {
        let attr = attrs[i]
        if (attr.name === 'style') {
            // color:red  => {color:red}
            let obj = {}
            attr.value.split(";").forEach(item => {
                let [key,value] = item.split(":");
                obj[key] = value
            });
            attr.value = obj
        }
        str += `${attr.name}:${JSON.stringify(attr.value)},`
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
        let text = node.text
        if (defaultTagRE.test(text)) {
            // 将{{hello}}hello 这样的格式处理成_s(hello)+'hello' 
            let tokens = [];
            let match;
            defaultTagRE.lastIndex = 0
            let lastIndex = 0;
            while (match=defaultTagRE.exec(text)) {
                let index = match.index
                if (index > lastIndex) {
                    tokens.push(JSON.stringify(text.slice(lastIndex,index)))
                }
                tokens.push(`_s(${match[1].trim()})`)
                lastIndex = index+match[0].length
                // console.log(index,"77");
                
            }
            if (lastIndex < text.length) {
                tokens.push(JSON.stringify(text.slice(lastIndex)))
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
    let children = genChildren(ast.children)
    let code = (`_c('${ast.tag}',${ast.attrs.length> 0 ? genProps(ast.attrs):'null'}${ast.children.length>0 ?`,${children}`:""})`)
    return code
}

// 模板引擎的实现原理 with + new Function
export function compileToFunction(template){
    // 1、就是将template转化成ast语法树
    let ast = parseHTML(template)
    // console.log(ast);
    // 2、生成render方法(render方法执行后的结果就是虚拟DOM)
    let code = codegen(ast)
    code = `with(this) {return ${code}}`
    let render = new Function(code); // 根据code生成render函数
    // console.log(render.toString());
    // function render() {
    //     with(this) {return _c('div',{id:"app",style:{"color":" red","background":" yellow"}},_c('div',{style:{"color":" red"}},_v(_s(name)+"hello"+_s(name)+"red")),_c('span',null,_v(_s(age))))}
    // }
    return render
}