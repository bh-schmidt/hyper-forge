import { ReservedVariablesTypes, VariablesTypes } from "@/forges/VariableMapper"
import chalk from "chalk"
import Stream from "stream"
import { ForgeRunner } from "./ForgeRunner"
import { Forge } from "./forges/Forge"
import { ForgeFs } from "./forges/ForgeFs"
import { ForgePaths } from "./forges/ForgePaths"
import { ForgeProgram } from "./forges/ForgeProgram"
import { ForgePrompts } from "./forges/ForgePrompts"
import { ForgeVariables } from "./forges/ForgeVariables"
import { MemForgeFs } from "./forges/MemForgeFs"
import { HyperForgeData } from "./internals/HyperForgeData"
import { RunnerProvider } from "./internals/RunnerProvider"

type ExecutionType = 'manual' | 'auto'
type UpdateVariablesStrategy = 'no-update' | 'update-origin' | 'update-compose' | 'update-both'

export interface ForgeComposerOptions<TVariables extends VariablesTypes> {
    forgeId: string
    taskId?: string
    executionType?: ExecutionType
    initialVariables?: Partial<TVariables>
    updateVariablesStrategy?: UpdateVariablesStrategy
    composerName?: string
}

export interface LoadComposerArgs {
    originForge: Forge
    rebuild?: boolean
    stdin?: Stream.Readable
    stdout?: Stream.Readable
}

export class ForgeComposer<TVariables extends VariablesTypes = ReservedVariablesTypes> {
    private runner?: ForgeRunner
    private originForge?: Forge
    private forge?: Forge

    private loaded = false
    private initExecuted: boolean = false
    private promptExecuted: boolean = false
    private prepareExecuted: boolean = false
    private writeExecuted: boolean = false
    private conflictsExecuted: boolean = false
    private commitExecuted: boolean = false
    private rollbackExecuted: boolean = false
    private endExecuted: boolean = false

    get paths(): ForgePaths {
        return this.forge!.paths
    }

    get variables(): ForgeVariables<TVariables & ReservedVariablesTypes> {
        return this.forge!.variables as any
    }

    get program(): ForgeProgram {
        return this.forge!.program
    }

    get prompts(): ForgePrompts<TVariables & ReservedVariablesTypes> {
        return this.forge!.prompts
    }

    get fs(): ForgeFs {
        return this.forge!.fs
    }

    get memFs(): MemForgeFs {
        return this.forge!.memFs
    }

    constructor(public options: ForgeComposerOptions<TVariables & ReservedVariablesTypes>) {
        options.executionType ??= 'auto'
        options.updateVariablesStrategy ??= 'no-update'
    }

    async load(args: LoadComposerArgs) {
        if (this.loaded) {
            throw new Error(`Can't load the composer twice`)
        }

        if (!args.originForge) {
            throw new Error('originForge is required')
        }

        this.loaded = true

        this.originForge = args.originForge

        const forges = await HyperForgeData.readForges()
        if (!forges || forges.length == 0) {
            console.log(chalk.red('No forges installed.'))
            process.exit(1)
        }

        const forge = forges.find(e => e.id == this.options.forgeId)
        if (!forge) {
            console.log(chalk.red(`Forge '${this.options.forgeId}' does not exist.`))
            process.exit(1)
        }

        const task = forge?.tasks.find(e => e.id == this.options.taskId)
        if (!task) {
            console.log(chalk.red(`Task '${this.options.taskId}' does not exist`))
            process.exit(1)
        }

        this.runner = await RunnerProvider.getForgeRunner({
            forge: forge!,
            task: task!,
            isComposed: true,
            rebuild: args.rebuild,
            stdin: args.stdin,
            stdout: args.stdout
        })

        this.forge = this.runner.getForge()

        if (this.options.initialVariables) {
            await this.forge.variables.setValues(this.options.initialVariables)
        }
    }

    async init() {
        if (this.initExecuted) {
            return
        }

        this.initExecuted = true
        this.validate()

        await this.updateComposeVariables()
        await this.runner?.init()
        await this.updateOriginVariables()
    }

    async prompt() {
        if (this.promptExecuted) {
            return
        }

        this.promptExecuted = true
        this.validate()

        await this.updateComposeVariables()
        await this.runner?.prompt()
        await this.updateOriginVariables()
    }

    hasRegisteredQuestions(): boolean {
        this.validate()
        return this.runner!.hasRegisteredQuestions()
    }

    async reprintAnswers() {
        this.validate()

        await this.updateComposeVariables()
        await this.runner!.reprintAnswers()
        await this.updateOriginVariables()
    }

    async prepare() {
        if (this.prepareExecuted) {
            return
        }

        this.prepareExecuted = true
        this.validate()

        await this.updateComposeVariables()
        await this.runner?.prepare()
        await this.updateOriginVariables()
    }

    async write() {
        if (this.writeExecuted) {
            return
        }

        this.writeExecuted = true
        this.validate()

        await this.updateComposeVariables()
        await this.runner?.write()
        await this.updateOriginVariables()
    }

    async conflicts() {
        if (this.conflictsExecuted) {
            return
        }

        this.conflictsExecuted = true
        this.validate()

        await this.updateComposeVariables()
        await this.runner?.conflicts()
        await this.updateOriginVariables()
    }

    async commit() {
        if (this.commitExecuted) {
            return
        }

        this.commitExecuted = true
        this.validate()

        await this.updateComposeVariables()
        await this.runner?.commit()
        await this.updateOriginVariables()
    }

    async rollback() {
        if (this.rollbackExecuted) {
            return
        }

        this.rollbackExecuted = true
        this.validate()

        await this.updateComposeVariables()
        await this.runner?.rollback()
        await this.updateOriginVariables()
    }

    async end() {
        if (this.endExecuted) {
            return
        }

        this.endExecuted = true
        this.validate()

        await this.updateComposeVariables()
        await this.runner?.end()
        await this.updateOriginVariables()
    }

    private async updateComposeVariables() {
        if (this.options.updateVariablesStrategy == 'no-update' || this.options.updateVariablesStrategy == 'update-origin') {
            return
        }

        const variables = await this.originForge!.variables.getValues()
        await this.forge!.variables.setValues(variables)
    }

    private async updateOriginVariables() {
        if (this.options.updateVariablesStrategy == 'no-update' || this.options.updateVariablesStrategy == 'update-compose') {
            return
        }

        const variables = await this.forge!.variables.getValues()
        await this.originForge!.variables.setValues(variables)
    }

    private validate() {
        if (!this.loaded) {
            console.log(chalk.red(`Composer was not loaded.`))
            process.exit(1)
        }

        if (!this.runner) {
            console.log(chalk.red(`Runner was not instanced.`))
            process.exit(1)
        }

        if (!this.forge) {
            console.log(chalk.red(`Forge was not instanced.`))
            process.exit(1)
        }
    }
}