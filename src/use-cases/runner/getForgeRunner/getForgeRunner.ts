import { ForgeBuilder } from "@/forges/ForgeBuilder";
import { ForgeInfo, TaskInfo } from "@/internals/Types";
import chalk from "chalk";
import { Command } from "commander";
import { execa } from "execa";
import fs from 'fs-extra';
import { glob } from "glob";
import { join } from "path";
import Stream from "stream";
import { pathToFileURL } from "url";
import { ForgeRunner } from "../../../ForgeRunner";
import { Prompts } from "../../../utils/Prompts";

export interface GetForgeRunnerArgs {
    forge: ForgeInfo;
    task: TaskInfo;
    variables?: any
    rebuild?: boolean
    isComposed?: boolean
    stdin?: Stream.Readable
    stdout?: Stream.Readable
}

export async function getForgeRunner(args: GetForgeRunnerArgs) {
    let filePath = args.task.filePath

    let shouldBuild = false
    if (args.forge.isTypescript) {
        if (args.rebuild) {
            shouldBuild = true
        }
        else if (!args.forge.distExist) {
            shouldBuild = true
        }
        else if (args.forge.rebuildStrategy == 'always') {
            shouldBuild = true
        }
        else if (args.forge.rebuildStrategy == 'ask') {
            const answer = await Prompts.prompt({
                name: 'rebuild',
                type: 'confirm',
                message: 'Rebuild the typescript project?'
            })

            shouldBuild = answer.rebuild
        }
    }

    if (args.forge.isTypescript && shouldBuild) {
        console.log(chalk.yellow("Typescript project detected, preparing to build the project.\n"))
        const packageJson = join(args.forge.directory, 'package.json')
        const json = await fs.readJSON(packageJson)

        if (!json['scripts']?.['build']) {
            console.log(chalk.red("Build your typescript project or add a script called 'build' in your package.json."))
            process.exit(1)
        }

        console.log(`Installing ${chalk.cyan(args.forge.name)}`)
        const { failed: installFailed, } = await execa(`npm install`, { shell: true, reject: false, cwd: args.forge.directory, stdio: 'inherit' })

        if (installFailed) {
            console.log(chalk.red(`An error ocurred during 'npm install'`))
            process.exit(1)
        }

        console.log(`Building ${chalk.cyan(args.forge.name)}`)
        const { failed: buildFailed, } = await execa(`npm run build`, { shell: true, reject: false, cwd: args.forge.directory, stdio: 'inherit' })

        if (buildFailed) {
            console.log(chalk.red(`An error ocurred during 'npm run build'`))
            process.exit(1)
        }

        if (!await fs.exists(join(args.forge.directory, 'dist'))) {
            console.log(chalk.red("The project was built but no dist was created"))
            process.exit(1)
        }

        const distDir = join(args.forge.directory, "dist", args.task.id)
        const files = await glob('index.+(js|mjs|cjs)', { cwd: distDir, absolute: true, nodir: true, stat: true, dot: true })
        if (!files.length) {
            console.log(chalk.red(`The project was built but the directory '${distDir}' has no index file`))
            process.exit(1)
        }

        filePath = files[0]
        console.log(chalk.green("Build complete\n"))
    }

    const moduleUrl = pathToFileURL(filePath)
    const module = await import(moduleUrl.href)

    if (!module.default) {
        console.log(`There is nothing being exported as default the index script.\n`)
        console.log(`Make sure to export the forge as default:`)
        console.log(`\texport default createForge()`)
    }

    if (!('buildRunner' in module.default)) {
        console.log(`The default export is not a valid instance.\n`)
        console.log(`Make sure to export the forge as default:`)
        console.log(`\texport default createForge()`)
    }

    const instance = module.default as ForgeBuilder
    const runner = await instance.buildRunner({
        targetDir: process.cwd(),
        rootDir: args.forge.directory,
        forgeId: args.forge.id,
        taskId: args.task.id,
        rebuild: args.rebuild,
        variables: args.variables,
        isComposed: args.isComposed,
        stdin: args.stdin,
        stdout: args.stdout
    })

    if (!('run' in runner)) {
        console.log(`The built object is not a valid runner.\n`)
        console.log(`Make sure to export the forge as default:`)
        console.log(`\texport default createForge()`)
    }

    return runner as ForgeRunner
}