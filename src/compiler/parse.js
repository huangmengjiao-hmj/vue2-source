const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配到的是一个标签名 <div 匹配到的是开始标签
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配的是</xxx> 最终匹配到的是结束标签
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性
// 第一个分组是属性的key value 就是分组3/4/5
const startTagClose = /^\s*(\/?)>/; // <div> <br />

// vue3中没有采用正则

// 对模板进行编译处理

export function parseHTML(html) { // html最开始肯定是一个<
    // 最终需要转化成一颗抽象语法树
    const ELEMENT_TYPE = 1
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
       let node = createASTElment(tag,attrs) // 创造一个ast节点
       if (!root) { // 看一下是否为空树
           root = node // 为空 则第一个是当前节点的根节点
       }
       if (currentParent) {
           node.parent = currentParent 
           currentParent.children.push(node)
       }
       stack.push(node);
       currentParent = node 
        // console.log(stack,currentParent,'开始');
    }
    function chars(text) {
        text = text.replace(/\s/g,'')
        text &&currentParent.children.push({  // 文本直接放到当前指向的节点中
            type:TEXT_TYPE,
            text,
            parent:currentParent
        })
        
    }
    function end(tag) {
        stack.pop(); // 弹出最后一个
        // console.log(stack);
       currentParent = stack[stack.length -1]
        
    }
    function advance(n) {
        html = html.substring(n)
    }
    function parseStartTag() {
        const start = html.match(startTagOpen)
        if (start) {
            const match = {
                tagName:start[1], // 标签名
                attrs:[], // 属性
            }
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
                })
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
            const startTagMatch = parseStartTag()
            if (startTagMatch) {
                start(startTagMatch.tagName,startTagMatch.attrs)
                continue;
            }
            let endTagMatch = html.match(endTag)
            if(endTagMatch){
                end(endTagMatch[1])
                advance(endTagMatch[0].length)
                continue;
            }
        }
        if (textEnd > 0) {
            let text = html.substring(0,textEnd); // 文本的内容
            if (text) {
                chars(text)
                advance(text.length)
            }
            
        }
    }
    // console.log(root);
    return root
}