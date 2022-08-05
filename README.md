# run-server-script

利用[node-ssh](https://github.com/steelbrain/node-ssh.git)连接服务器，可以使用git更新项目代码，安装npm包，执行package.json里的scripts命令。

## Installing
Using npm:

```bash
$ npm install run-server-script --save-dev
```

Using yarn:

```bash
$ yarn add run-server-script -D
```

## Example
```javascript 
import deploy from "run-server-script";

serverScript({
  serverPath: "/data/www/test",
  gitRemoteUrl: "git@github.com:HoseaGuo/blog-next-js.git", 
  scriptQueue: [
    "build",
    "serve",
  ],
  sshConfig: {
    host: 'localhost',
    username: 'root',
    password: 'root'
  }
})
```

## API

```typescript
import { Config } from "node-ssh";

interface Options {
  /* 服务器部署路径，默认："/data/www/_test" */
  serverPath: string,
  /* 
    git远程仓库地址， 默认没有，不进行git操作，
    如果有设置，会根据服务器目录中是否有.git文件来执行git操作，有则 `git pull`，否则 `git clone` 
    因服务器需要要进行`git clone` 或者 `git pull`操作，所以要先在git仓库上配置好服务器的 ssh keys
  */
  gitRemoteUrl?: string,
  /* package.json 里 的scripts 队列名，默认： [] */
  scriptQueue?: string[],
  /* 是否安装npm包， 默认：false */
  npmInstall?: boolean,
  /* node-ssh connect config */
  sshConfig: Config
}
```