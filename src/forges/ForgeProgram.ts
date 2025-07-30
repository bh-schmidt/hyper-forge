import { RunCommandOptions, Writable } from "@/forges/Types";
import chalk from "chalk";
import { execa, Options, ResultPromise } from "execa";
import { Forge } from "./Forge";

export class ForgeProgram {
    constructor(private forge: Forge) { }

    runCommand<TOptions extends Writable<Options> = Options>(command: string, options: RunCommandOptions<TOptions> = {}): ResultPromise<{} & TOptions> {
        options ??= {}
        options.printCommand ??= true
        options.printResult ??= true
        options.printStdout ??= false
        options.printStderr ??= true

        const execaOptions = options.execaOptions ?? {} as TOptions
        execaOptions.cwd ??= this.forge.paths.targetPath()

        if (options.printCommand) {
            const fullCommand = this.getFullCommand(command, options.args)
            console.log(`- ${chalk.cyan.bold(fullCommand)}`)
        }

        const returnPromise = execa<TOptions>(command, options.args, execaOptions)

        if (options.printStdout) {
            returnPromise.stdout?.on('data', chunk => {
                process.stdout.write(chunk)
            })
        }

        if (options.printStderr) {
            returnPromise.stderr?.on('data', chunk => {
                process.stderr.write(chunk)
            })
        }

        if (options.printResult) {
            returnPromise
                .then(() => {
                    console.log(`- ${chalk.green('Command finished with success.\n')}`)
                })
                .catch((err) => {
                    const code = err?.exitCode ?? err?.code
                    if (code) {
                        console.log(`- ${chalk.red(`An error occurred. Exit code: ${code}`)}`)
                    } else {
                        console.log(`- ${chalk.red(`An error occurred.`)}`)
                    }
                })
        }

        return returnPromise
    }

    private getFullCommand(command: string, params?: string[]) {
        const cleanParams = params ?
            params.map(e => `"${e.toString().replace('"', '\\"')}"`) :
            []

        return `${command} ${cleanParams.join(' ')}`
    }
}