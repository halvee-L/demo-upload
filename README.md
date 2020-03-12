# demo-upload

上传 demo 源码

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```

### 插件 API

引用

```
import UploadPlugin from "./components/upload";
// define(['UploadPlugin'],function(){UploadPlugin})

```

初始化

```
new UploadPlugin(options)

```

参数列表

```

{
 url: "", // 上传地址
    multiple: false, // 是否多选
    // 多个文件上传方式
    //multiple: 多请求上传模式，每个可单独取消，查看进度
    //single:  单请求上传模式 当多个文件上传时，只能查看总进度，取消所有上传
    uploadType: "multiple",
    append: false, // 是否追加
    field: "file", // 上传字段
    accept: "*" // 上传文件类型
}
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
