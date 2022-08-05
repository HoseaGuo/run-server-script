import { NodeSSH, Config } from "node-ssh";
import { exit } from "process";
import chalk from 'chalk'
import DraftLog from 'draftlog';

DraftLog(console)


interface Options {
  /* 服务器部署路径 */
  serverPath: string,
  /* git远程仓库地址 因服务器需要要进行`git clone` 或者 `git pull`操作，所以要先在git仓库上配置好服务器的 ssh keys */
  gitRemoteUrl?: string,
  /* 需要运行的package.json里的scripts的key数组，按照index顺序执行 */
  scriptQueue?: string[],
  /* 是否安装npm包 */
  npmInstall?: boolean,
  /* node-ssh connect config */
  sshConfig: Config
}

const ssh = new NodeSSH();

let serverPath = "";

function serverScript(options: Options) {
  let { serverPath: _serverPath, gitRemoteUrl, scriptQueue, npmInstall, sshConfig } = options;

  serverPath = _serverPath || '/data/www/_test';

  ssh.connect(sshConfig).then(async function () {

    console.log('ssh connect success')

    if (gitRemoteUrl) await gitUpdate(gitRemoteUrl);

    if (npmInstall !== undefined ? npmInstall : false) await npmInstallFn();

    await runScriptQueue(scriptQueue);

    ssh.dispose();

    console.log('ssh dispose')
  }).catch(e => {
    console.log(e)
    exit(1);
  })
}

// 更新git，假设git没有部署，则克隆下来
async function gitUpdate(gitRemoteUrl: string) {
  let loadingEnd = loadingLog("git更新");
  await ssh.execCommand(`cd ${serverPath}`, { cwd: serverPath });
  let findGitRes = await ssh.execCommand(`find .git`, { cwd: serverPath });
  if (findGitRes.code !== 0) {
    // 没有找到.git文件，则克隆下来
    let res = await ssh.execCommand(`git clone ${gitRemoteUrl} .`, { cwd: serverPath });
    if (res.code !== 0) {
      console.log(res.stderr)
      loadingEnd(false);
      exit(1);
    }
  } else {
    // git pull 更新
    let res = await ssh.execCommand(`git pull`, { cwd: serverPath });
    if (res.code !== 0) {
      console.log(res.stderr)
      loadingEnd(false);
      exit(1);
    }
  }
  loadingEnd();
}

async function npmInstallFn() {
  let loadingEnd = loadingLog("npm包安装");
  await ssh.execCommand(`cd ${serverPath}`, { cwd: serverPath });
  await ssh.execCommand(`npm install`, { cwd: serverPath });
  loadingEnd();
}

// 执行script命令
async function runScript(name: string) {
  let loadingEnd = loadingLog(`script task: ${name}`);
  await ssh.execCommand(`cd ${serverPath}`, { cwd: serverPath });
  let res = await ssh.execCommand(`npm run ${name}`, { cwd: serverPath });
  if (res.code !== 0) {
    console.log(res);
    loadingEnd(false);
  }
  loadingEnd();
}

async function runScriptQueue(scriptQueue: string[] = []) {
  let len = scriptQueue.length;
  for (let i = 0; i < len; i++) {
    let scriptName = scriptQueue[i];
    await runScript(scriptName);
  }
}

function loadingLog(str: string) {
  let startTimestamp = process.hrtime.bigint();
  let frames = ['-', '\\', '|', '/']
  let index = 0;
  let update = console.draft(str + frames[index]);
  let timer = setInterval(() => {
    index = (index + 1) % frames.length
    update(`[${frames[index]}] ${str}`);
  }, 50)
  return function end(isSuccess: boolean = true) {
    clearInterval(timer);
    if (isSuccess) {
      let endTimestamp = process.hrtime.bigint();

      update(chalk.rgb(92, 175, 158)(`[√] ${str} `) + chalk.whiteBright(formatNs(endTimestamp - startTimestamp)));
    } else {
      update(chalk.red(`[×] ${str}`));
      // 退出程序
      exit(1);
    }
  }
}

function formatNs(nsTime: any) {
  nsTime = Number(nsTime);
  if (nsTime < 1000) {
    return `${(nsTime / 1000).toFixed(3)}ms`
  } else if (nsTime < 1000 ** 2) {
    return `${(nsTime / 1000).toFixed(3)}ms`
  } else if (nsTime < 1000 ** 3) {
    return `${(nsTime / (1000 ** 3)).toFixed(3)}s`
  } else {
    return `${(nsTime / (1000 ** 3)).toFixed(3)}s`
  }
}

export default serverScript;