import { Forge } from "@/forges/Index";
import { ForgeEventAction, ForgeStages, PromiseOrValue, TypeOrLooseType } from "@/forges/Types";
import { VariableMap, VariableMapper, VariableMapperOptions, VariablesTypes, VariablesTypesExtractor } from "@/forges/VariableMapper";
import { Path } from "@/utils/Path";
import { join } from "path";
import Stream from "stream";
import { FileInjector } from "../file-injectors/Types";
import { ForgeComposer } from "../ForgeComposer";
import { ForgeRunner } from "../ForgeRunner";
import { NameInjector } from "../name-injectors/Types";
import { ForgeConfigOptions } from "./ForgeConfig";
import { ForgePromptsOptions } from "./ForgePrompts";
import { ForgeVariablesOptions } from "./ForgeVariables";
import { TempFs } from "./TempFs";

export interface ExecutionArgs {
    targetDir: string
    rootDir: string
    forgeId: string
    taskId: string
    variables: any
    rebuild?: boolean
    isComposed?: boolean
    skipCommandConfiguration?: boolean
    stdin?: Stream.Readable
    stdout?: Stream.Readable
}

export class ForgeBuilder<TVariables extends VariablesTypes = VariablesTypes> {
    private _setup?: () => PromiseOrValue<void>
    private runner?: ForgeRunner
    private forge: Forge

    constructor() {
        this.forge = new Forge()
    }

    registerVariables<TVariables extends VariableMap, TOptions extends VariableMapperOptions>(map: VariableMapper<TVariables, TOptions>) {
        this.forge.variables.mapper = map as any

        type NewType = TypeOrLooseType<VariablesTypesExtractor<TVariables>, TOptions['allowUnmapped']>
        return this as any as ForgeBuilder<NewType>
    }

    fileInjector(injector: FileInjector) {
        this.forge.fileInjector = injector
        return this
    }

    nameInjector(injector: NameInjector) {
        this.forge.nameInjector = injector
        return this
    }

    configOptions(options: ForgeConfigOptions) {
        this.forge.config._options = {
            ...this.forge.variables._options,
            ...options
        }

        return this
    }

    variablesOptions(options: ForgeVariablesOptions) {
        this.forge.variables._options = {
            ...this.forge.variables._options,
            ...options
        }

        return this
    }

    promptsOptions(options: ForgePromptsOptions) {
        this.forge.prompts._options = {
            ...this.forge.prompts._options,
            ...options
        }

        return this
    }

    registerComposer(composer: ForgeComposer<any>) {
        this.forge.composers.push(composer)
        return this
    }

    on(name: ForgeStages, action: ForgeEventAction<TVariables>) {
        this.forge.eventEmitter.addListener(name, action)
        return this
    }

    setup(setup: () => PromiseOrValue<void>) {
        this._setup = setup
        return this
    }

    async buildRunner(executionArgs: ExecutionArgs) {
        if (this.runner)
            return this.runner

        this.forge.id = executionArgs.forgeId
        this.forge.taskId = executionArgs.taskId
        this.forge.isComposed = executionArgs.isComposed ?? false

        if (executionArgs.variables) {
            await this.forge.variables.setValues(executionArgs.variables)
        }

        this.forge.paths._rootDir = executionArgs.rootDir
        this.forge.paths._targetDir = executionArgs.targetDir
        this.forge.paths._sourceDir = join(executionArgs.rootDir, 'templates', executionArgs.taskId)
        this.forge.paths._scriptsDir = join(executionArgs.rootDir, 'scripts', executionArgs.taskId)
        this.forge.paths._tempDir = Path.tempPath("executions", crypto.randomUUID())

        this.forge.stdin = executionArgs.stdin ?? process.stdin
        this.forge.stdout = executionArgs.stdout ?? process.stdout

        this.forge.memFs._tempFs = new TempFs(this.forge.paths.tempPath(), this.forge.fileInjector, this.forge.nameInjector)

        if (this._setup) {
            await this._setup()
        }

        for (const composer of this.forge.composers) {
            await composer.load({
                originForge: this.forge,
                rebuild: executionArgs.rebuild,
                stdin: this.forge.stdin,
                stdout: this.forge.stdout
            })
        }

        return new ForgeRunner(this.forge)
    }
}

export function createForge() {
    return new ForgeBuilder()
}