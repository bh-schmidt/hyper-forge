import { ForgeStages } from '@/forges/Types';
import chalk from 'chalk';
import fs from 'fs-extra';
import { join } from "path";
import prompts from "prompts";
import { lock } from "proper-lockfile";
import { Forge } from "./forges/Forge";
import { File } from "./utils/File";
import { Globber } from "./utils/Globber";

export class ForgeRunner {
    lockFilePath: string
    private releaseLock: (() => Promise<void>) | undefined

    constructor(private forge: Forge) {
        this.lockFilePath = join(forge.paths.tempPath(), '.lock')
    }

    getForge() {
        return this.forge
    }

    async run() {
        await this.init();
        await this.prompt()

        try {
            await this.prepare()
            await this.write()
            await this.conflicts()

            if (this.forge.currentStage !== 'rollback') {
                await this.commit();
            }
        } catch (error) {
            console.log(`An error ocurred during '${this.forge.currentStage}' stage:\n${error}\n\nRolling back...`)

            await this.rollback();
        }

        await this.end()
    }

    async init() {
        this.forge.setStage('init')

        if (await this.forge.config.configExists()) {
            const newDir = await this.forge.config.getConfigDirectory()
            this.forge.paths.setTargetDir(newDir)
        }

        const targetDirectory =
            await this.forge.variables.get('INITIAL_DIRECTORY') ??
            await this.forge.config.get({ key: 'INITIAL_DIRECTORY' })

        if (targetDirectory && typeof targetDirectory == 'string') {
            this.forge.paths.setTargetDir(targetDirectory)
        }

        await fs.ensureDir(this.forge.paths.tempPath())
        await fs.writeFile(this.lockFilePath, '');
        this.releaseLock = await lock(this.lockFilePath)


        const skipInitStage = await this.shouldSkip('init')
        if (!skipInitStage) {
            await this.forge.eventEmitter.emit('init', this.forge)

            const composers = this.getAutomaticComposers()
            for (const composer of composers) {
                await composer.init()
            }
        }
    }

    async prompt() {
        this.forge.setStage('prompt')

        const skip = await this.shouldSkip('prompt')
        if (!skip) {
            await this.forge.eventEmitter.emit('prompt', this.forge)

            const composers = this.getAutomaticComposers()
            for (const composer of composers) {
                await composer.prompt()
            }

            if (!this.forge.isComposed) {
                if (this.forge.prompts._options.clearAfterStage) {
                    console.clear()
                }

                if (this.forge.prompts._options.reprintAfterStage) {
                    await this.reprintAnswers()
                }
            }
        }
    }

    hasRegisteredQuestions(): boolean {
        return this.forge.prompts.questions.length > 0 ||
            this.forge.composers.some(e => e.hasRegisteredQuestions())
    }

    async reprintAnswers() {
        await this.forge.prompts.reprintAnswers()
        console.log()

        for (const composer of this.forge.composers) {
            if (!composer.hasRegisteredQuestions()) {
                continue
            }

            if (composer.options.composerName) {
                console.log(` - ${composer.options.composerName}`)
            }

            await composer.reprintAnswers()
        }
    }

    async prepare() {
        this.forge.setStage('prepare')

        const skip = await this.shouldSkip('prepare')
        if (!skip) {
            await this.forge.eventEmitter.emit('prepare', this.forge)

            const composers = this.getAutomaticComposers()
            for (const composer of composers) {
                await composer.prepare()
            }
        }
    }

    async write() {
        this.forge.setStage('write')

        const skip = await this.shouldSkip('write')
        if (!skip) {
            await this.forge.eventEmitter.emit('write', this.forge)

            const composers = this.getAutomaticComposers()
            for (const composer of composers) {
                await composer.write()
            }
        }
    }

    async conflicts() {
        this.forge.setStage('conflicts')

        const maps = this.forge.memFs.getTempPaths('file', true)

        for await (const map of maps) {
            if (!await this.forge.fs.existsTarget(map.targetPath)) {
                await this.forge.memFs.approveFile(map.targetPath)
                continue
            }

            if (await File.equal(map.targetPath, map.tempPath!)) {
                continue
            }

            let answer: prompts.Answers<'action'> | undefined = undefined

            if (!map.ifFileExists || map.ifFileExists == 'ask') {
                answer = await prompts({
                    name: 'action',
                    type: 'select',
                    message: `The file '${map.targetPath}' already exists\nSelect your action:`,
                    choices: [
                        {
                            title: 'Replace',
                            value: 'replace'
                        },
                        {
                            title: 'Ignore',
                            value: 'ignore'
                        },
                        {
                            title: 'Stop Execution',
                            value: 'stop'
                        },
                        {
                            title: 'Rollback',
                            value: 'rolback'
                        }
                    ],
                    initial: 0
                })
            }

            if (map.ifFileExists == 'replace' || answer?.action == 'replace') {
                await this.forge.memFs.approveFile(map.targetPath)
                continue
            }

            if (map.ifFileExists == 'ignore' || answer?.action == 'ignore') {
                continue
            }

            if (map.ifFileExists == 'throw') {
                throw new Error(`The file '${map.targetPath}' already exists.`)
            }

            if (answer?.action == 'stop') {
                console.log('Execution stopped')
                process.exit()
            }

            if (answer?.action == 'rollback') {
                await this.rollback()
                return
            }

            throw new Error('Conflict resolution not implemented')
        }

        const skip = await this.shouldSkip('conflicts')
        if (!skip) {
            await this.forge.eventEmitter.emit('conflicts', this.forge)

            const composers = this.getAutomaticComposers()
            for (const composer of composers) {
                await composer.conflicts()
            }
        }
    }

    async commit() {
        this.forge.setStage('commit')

        if (this.forge.config._options.autoSave) {
            await this.forge.config.save()
        }

        await this.forge.memFs.commit()

        const skip = await this.shouldSkip('commit')
        if (!skip) {
            await this.forge.eventEmitter.emit('commit', this.forge)

            const composers = this.getAutomaticComposers()
            for (const composer of composers) {
                await composer.commit()
            }
        }
    }

    async rollback() {
        this.forge.setStage('rollback')

        if (this.forge.memFs.isDisposed()) {
            console.log(chalk.yellow.bold(`Changes were already committed, could not rollback. Please do it manually or configure it on rollback stage.`))
        } else {
            await this.forge.memFs.rollback()
        }

        const skip = await this.shouldSkip('rollback')
        if (!skip) {
            await this.forge.eventEmitter.emit('rollback', this.forge)

            const composers = this.getAutomaticComposers()
            for (const composer of composers) {
                await composer.rollback()
            }
        }
    }

    async end() {
        this.forge.setStage('end')

        const skip = await this.shouldSkip('end')
        if (!skip) {
            await this.forge.eventEmitter.emit('end', this.forge)

            const composers = this.getAutomaticComposers()
            for (const composer of composers) {
                await composer.end()
            }
        }

        const paths = Globber.iterator('**/*', {
            cwd: this.forge.paths.tempPath(),
            ignore: ['.lock'],
            nodir: true,
            absolute: true
        })

        for await (const path of paths) {
            await fs.rm(path)
        }

        if (this.releaseLock) {
            await this.releaseLock()
        }

        await fs.rm(this.forge.paths.tempPath(), { recursive: true })
    }

    private getAutomaticComposers() {
        return this.forge.composers.filter(e => e.options.executionType == 'auto')
    }

    private async shouldSkip(stage: ForgeStages) {
        const stagesToSkip = await this.getSkippedStages()
        return stagesToSkip.includes(stage)
    }

    private async getSkippedStages() {
        const stages =
            await this.forge.variables.get('INITIAL_DIRECTORY') ??
            await this.forge.config.get({ key: 'INITIAL_DIRECTORY' })

        if (!stages)
            return []

        if (typeof stages == 'string') {
            return stages.split(',')
        }

        if (Array.isArray(stages)) {
            return stages as string[]
        }

        return []
    }
}