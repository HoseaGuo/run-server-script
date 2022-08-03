'use strict';

var nodeSsh = require('node-ssh');
var process$1 = require('process');
var chalk = require('chalk');
var DraftLog = require('draftlog');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var DraftLog__default = /*#__PURE__*/_interopDefaultLegacy(DraftLog);

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

DraftLog__default["default"](console);
const ssh = new nodeSsh.NodeSSH();
let serverPath = "";
function serverScript(options) {
    let { serverPath: _serverPath, gitRemoteUrl, scriptQueue, npmInstall, sshConfig } = options;
    serverPath = _serverPath;
    ssh.connect(sshConfig).then(function () {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('ssh connect success');
            if (gitRemoteUrl)
                yield gitUpdate(gitRemoteUrl);
            if (npmInstall !== undefined ? npmInstall : true)
                yield npmInstallFn();
            yield runScriptQueue(scriptQueue);
            ssh.dispose();
            console.log('ssh dispose');
        });
    }).catch(e => {
        console.log(e);
        process$1.exit(1);
    });
}
// 更新git，假设git没有部署，则克隆下来
function gitUpdate(gitRemoteUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        let loadingEnd = loadingLog("git更新");
        yield ssh.execCommand(`cd ${serverPath}`, { cwd: serverPath });
        let findGitRes = yield ssh.execCommand(`find .git`, { cwd: serverPath });
        if (findGitRes.code !== 0) {
            // 没有找到.git文件，则克隆下来
            let res = yield ssh.execCommand(`git clone ${gitRemoteUrl} .`, { cwd: serverPath });
            if (res.code !== 0) {
                console.log(res.stderr);
                loadingEnd(false);
                process$1.exit(1);
            }
        }
        else {
            // git pull 更新
            let res = yield ssh.execCommand(`git pull`, { cwd: serverPath });
            if (res.code !== 0) {
                console.log(res.stderr);
                loadingEnd(false);
                process$1.exit(1);
            }
        }
        loadingEnd();
    });
}
function npmInstallFn() {
    return __awaiter(this, void 0, void 0, function* () {
        let loadingEnd = loadingLog("npm包安装");
        yield ssh.execCommand(`cd ${serverPath}`, { cwd: serverPath });
        yield ssh.execCommand(`npm install`, { cwd: serverPath });
        loadingEnd();
    });
}
// 执行script命令
function runScript(name) {
    return __awaiter(this, void 0, void 0, function* () {
        let loadingEnd = loadingLog(`script task: ${name}`);
        yield ssh.execCommand(`cd ${serverPath}`, { cwd: serverPath });
        let res = yield ssh.execCommand(`npm run ${name}`, { cwd: serverPath });
        if (res.code !== 0) {
            console.log(res);
            loadingEnd(false);
        }
        loadingEnd();
    });
}
function runScriptQueue(scriptQueue = []) {
    return __awaiter(this, void 0, void 0, function* () {
        let len = scriptQueue.length;
        for (let i = 0; i < len; i++) {
            let scriptName = scriptQueue[i];
            yield runScript(scriptName);
        }
    });
}
function loadingLog(str) {
    let startTimestamp = process.hrtime.bigint();
    let frames = ['-', '\\', '|', '/'];
    let index = 0;
    let update = console.draft(str + frames[index]);
    let timer = setInterval(() => {
        index = (index + 1) % frames.length;
        update(`[${frames[index]}] ${str}`);
    }, 50);
    return function end(isSuccess = true) {
        clearInterval(timer);
        if (isSuccess) {
            let endTimestamp = process.hrtime.bigint();
            update(chalk__default["default"].rgb(92, 175, 158)(`[√] ${str} `) + chalk__default["default"].whiteBright(formatNs(endTimestamp - startTimestamp)));
        }
        else {
            update(chalk__default["default"].red(`[×] ${str}`));
            // 退出程序
            process$1.exit(1);
        }
    };
}
function formatNs(nsTime) {
    nsTime = Number(nsTime);
    if (nsTime < 1000) {
        return `${(nsTime / 1000).toFixed(3)}ms`;
    }
    else if (nsTime < 1000 ** 2) {
        return `${(nsTime / 1000).toFixed(3)}ms`;
    }
    else if (nsTime < 1000 ** 3) {
        return `${(nsTime / (1000 ** 3)).toFixed(3)}s`;
    }
    else {
        return `${(nsTime / (1000 ** 3)).toFixed(3)}s`;
    }
}

module.exports = serverScript;
