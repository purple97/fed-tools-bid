# fed-tools-bid 前端开发工具

-   web 开发工程化工具
-   dev 启动本地服务器
-   deploy/build/ 打包工程目录 src/p 中所有 index.js 文件 到 build 目录中

## 安装和初始化工程

-   依赖及模块安装
    1. 确保本机已经正常安装了 NodeJS，以及 npm 可以正常使用。
        - 安装方法请见：[NodeJS 官网](http://nodejs.cn/)
    2. 全局安装 fed-tools-bid 工具及构建依赖
        - **`sudo npm install fed-tools-bid -g`**
-   初始化工程
    1.  创建并进入新的工程目录 **`mkdir myNewProject && cd myNewProject` **
    2.  使用 bid 命令初始化工程目录 **`bid init`**
        -   `bid init`会自动在为当前目录安装相关依赖，如果安装依赖时出现问题，请移除工程目录下的 node_modules 文件夹，并使用`bid update`命令手动进行安装。update 命令具体使用方法请看下文。

## 开发调试

-   启动本地开发环境： **`bid dev [-p 端口号]]`**
    -   **注意：请在项目工程目录下启动开发调试命令**
    -   默认端口号：3333，请使用*http://127.0.0.1:3333启动页面*
-   目录结构约定

    -   注意：**`入口js和html文件，请存放至/src/p目录中，并使用index.js和index.html文件进行命名，否则将会影响发布构建`**

    ```
    /                   // 工程根目录
    ../deploy           // 构建文件存放目录
    ../node_modules     // 依赖模块目录
    ../src              // 开发目录
    ../src/c            // component组件存放目录
    ../src/p            // page页面目录
    ./config.json       // 构建配置文件（手动生成，自动更新version）
    ./build.json        // 云端发布配置文件(自动生成)
    ./.gitignore        // git忽略文件
    ./.editorconfig     // vscode编辑器配置
    ./.eslintignore     // eslint代码检测忽略文件
    ./.eslintrc.js      // eslint检测配置
    ```

## 编译打包及发布

-   远程发布(需搭建云端 CI 服务)： **`bid deploy`**
    1.  选择发布环境 [日常、预发、线上]
    2.  选择目标服务器组（日常 1、2、3 套、预发多套、线上服务器组）
    3.  输入**awp 前端发布系统**的账号及密码
    4.  选择要发布的页面
-   本地构建：**`bid deploy`**
    1.  选择发布环境 [本地构建]
    2.  选择构建方式 [日常方式、线上方式、Tag 方式]
    3.  选择需要构建的页面
-   构建方式介绍
    -   日常方式
        -   描述：[日常、预发]发布均采用此种构建方式。构建后，html 及 js 文件夹同属一级目录存放，html 通过相对路径来引用 js 文件，css 将内联至 html 文件中。
    -   线上方式
        -   描述：[线上]发布采用此种构建方式。只构建 html 及 css 文件，html 通过百融 CDN 路径来引用 js 文件（自动替换），css 将内联至 html 文件中。
    -   Tag 方式
        -   描述：当 gitlab 中的前端项目收到 git tag push 请求时，会触发 tag 发布。tag 方式构建，将会分别对 html 及 js 文件进行*全量*构建，并分别上传：html 文件将发布至预发服务器，js 文件将会发布至 CDN 源站。html 通过 CDN 路径来引用 js 文件（自动替换），css 将内联至 html 文件中。
-   注意：
    1.  _使用打包功能前，请确认您已经确保你已经配置 config.json 文件_ `./config.json`
    2.  如果要使用远程发布，需要您可以访问到**awp 前端发布系统**，否则请使用本地构建
    3.  进行日常构建发布时，会自动在项目根目录生成 build.json 文件

## 配置文件 config.json（打包编译、js 引用）

-   示例说明：
    ```
    {
        "appName": "fedtesst",
        "remotes": "https://github.com/purple97/fedtesst.git",
        "version": "0.0.1",
        "cdnhost": "//cdn.fed.com",
        "websiteHost": "//m.fed.cn",
        "alias": {
            "zepto": "webpack-zepto",
            "myslider": "@br/common/myslider",
        },
        "noParse": ['./src/p/index/index.js'],
    }
    ```

*   "appName" (string 工程名称):

    -   说明: 工程名称将决定日常、预发及线上部署时的部署路径；

*   "remotes" (git 仓库地址):

    -   说明: Git 仓库地址；若要使用远程发布，则必需填写该字段；

*   "version" (string 版本号):

    -   说明: Git 开发分支号（可由 bid 工具根据当前所处分支自动获取）

    *   关于 Git 版本号的约定：

        -   为了便于发布、回滚及代码管理，推荐采用 Git 分支开发，开发分支命名规则约定如下：
            -   **`$env/x.y.z`\***
                -   \$env: daily 日常环境、pre 预发环境、production 线上环境
                -   x.y.z: 大版本号.小分支号.bugFix 版本号
        -   约定 `version` 值为当前开发分支的分支号 x.y.z；

        -   约定 HTML 页面 js 入口资源引入方式如下：

            ```
                <script type="text/javascript" src="@cdnhost/src/p/index/@version/index.js"></script>
            ```

        -   构建时将会根据不同的构建方式（日常、线上、Tag，），对 script 文件的 src 属性进行替换，关于构建方式的描述请参见上文；

        -   根据分支号设置路径，主要目的是便于发布后对代码进行管理、引用、回滚等操作。

    *   注意：每次启动`bid dev`时，如果当前处于形如 daily/x.y.z 的开发分支，且 config.json 的 version 字段与当前分支号不一致，config.json 的 version 字段将被自动替换为当前分支号。

*   "cdnhost" (前端 js 静态资源 cdn 域名):

    -   说明:
        -   用于在发布时，使用线上 cdn 地址，替换 html 中形如`<script type="text/javascript" src="@cdnhost/src/p/fedtesst/@version/index.js"></script>`的文件引用。
        -   替换规则：
            -   形如`@cdnhost/src/p/fedtesst/@version/index.js`将会被替换为`//cdn.fed.com/fedtesst/src/p/about/0.2.1/index.js`
            -   cdnhost 将会替换`@cdnhost`
            -   version 将会替换`cdnhost + appName +`
            -   以上示例地址`@cdnhost/src/p/fedtesst/@version/index.js`将做如下转换：@cdnhost + appName + `/src/p/fedtesst/` + version + `/index.js`

*   "websiteHost"（线上域名）

    -   说明:
        -   在使用**awp 前端发布系统**进行远程发布时，需要配置此项，用于在发布系统中关联此项目的线上地址

*   "alias" (object):

    -   别名,通过别名约定，可以使我们在业务代码中直接 require([key])引用 js 模块。
        -   默认配置好别名 @br 指向 ./src/c/ 目录

    *   通过别名的定义，我们可以在业务代码中直接使用`require([别名])`引用 js 模块

        var myslider = require("@br/common/myslider");
        // 等同于 var myslider = require("../../c/common/myslider");
        var \$ = require("zepto")

*   "noParse"(String 或 Array，不检查配置路径所指向 js 的依赖)

## bid 命令详解

| 无                  | 命令           | 参数                           |                                             描述                                             |
| ------------------- | -------------- | ------------------------------ | :------------------------------------------------------------------------------------------: |
| 项目初始化          | `bid init`     | 无                             |                 在当前目录下，生成初始`普通`工程目录文件 及 完成相关依赖安装                 |
|                     | `bid init`     | -r\|--react                    |             在当前目录下，生成初始`react+redux`工程目录文件 及 完成相关依赖安装              |
| 开发调试            | `bid dev`      | 无                             |                             启动本地开发环境（默认端口号 3333）                              |
|                     | `bid dev`      | -p [端口号] \| --port [端口号] |                                以指定[端口号]启动本地开发环境                                |
|                     | `bid dev`      | -q\|--quiet(可选)              |                  （开启安静模式进行本地开发，只会显示 webpack 警告和错误）                   |
| 发布\构建（新）     | `bid deploy`   | 无                             | （新版：云端构建发布）可选择日常、预发、线上环境的远程发布，或进行本地多种方式的打包构建操作 |
| 发布\构建（旧）     | `bid build`    | 无                             |   （旧版：本地构建发布)可选择日常、预发、线上环境的本地发布，并通过 scp 从本地进行上传发布   |
| iconfont ttf base64 | `bid iconfont` | -i\|--input <filePath>         |                         对指定文件中的 iconfont ttf 进行 base64 转换                         |
|                     | `bid iconfont` | -o\|--output <filePath> (可选) |         将转换后的内容输出值 output 文件（若没有指定 output 则替换原有 input 文件）          |
|                     | `bid iconfont` | 示例                           |             bid iconfont -i src/c/less/iconfont.less -o src/c/less/iconfont.less             |
