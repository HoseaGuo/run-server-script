import { Config } from 'node-ssh';

interface Options {
    serverPath: string;
    gitRemoteUrl?: string;
    scriptQueue?: string[];
    npmInstall?: boolean;
    sshConfig: Config;
}
declare function serverScript(options: Options): void;

export { serverScript as default };
