// rollup 默认可以导出一个对象作为打包的配置文件
import babel from "rollup-plugin-babel"
import resolve from "@rollup/plugin-node-resolve"
export default{
    input:'./src/index.js', // 入口文件
    output:{
        file:"./dist/vue.js", // 出口文件
        name:"Vue",
        format:"umd", // 打包格式 esm es6模块 commonjs iife自执行函数 umd(兼容cjs、adm、iife)
        sourcemap:true, // 希望可以调试源代码
    },
    // 插件
    plugin:[
        babel({
            exclude:"node_modules/**" // 排除node_modules所有文件
        }),
        resolve()
    ]
}