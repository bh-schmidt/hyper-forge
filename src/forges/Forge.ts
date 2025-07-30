import { ForgeStages, IForge } from "@/forges/Types";
import { ReservedVariablesTypes, VariablesTypes } from "@/forges/VariableMapper";
import { FileInjectors, NameInjectors } from "@/Index";
import Stream from "stream";
import { FileInjector } from "../file-injectors/Types";
import { ForgeComposer } from "../ForgeComposer";
import { NameInjector } from "../name-injectors/Types";
import { EventEmitter } from "./EventEmitter";
import { ForgeConfig } from "./ForgeConfig";
import { ForgeFs } from "./ForgeFs";
import { ForgePaths } from "./ForgePaths";
import { ForgeProgram } from "./ForgeProgram";
import { ForgePrompts } from "./ForgePrompts";
import { ForgeVariables } from "./ForgeVariables";
import { MemForgeFs } from "./MemForgeFs";

export class Forge implements IForge<ReservedVariablesTypes> {
    private _stageHistory: ForgeStages[]
    private _currentStage: ForgeStages
    id: string
    taskId: string
    isComposed: boolean

    get stageHistory() {
        return [...this._stageHistory]
    }

    get currentStage(): ForgeStages {
        return this._currentStage
    }

    eventEmitter: EventEmitter
    composers: ForgeComposer[]

    fileInjector: FileInjector
    nameInjector: NameInjector

    stdin: Stream.Readable = null!;
    stdout: Stream.Readable = null!;

    paths: ForgePaths
    program: ForgeProgram
    fs: ForgeFs
    memFs: MemForgeFs
    variables: ForgeVariables<ReservedVariablesTypes>
    prompts: ForgePrompts<VariablesTypes>
    config: ForgeConfig<ReservedVariablesTypes>

    constructor() {
        this.id = null!
        this.taskId = null!
        this.isComposed = false
        this._stageHistory = ['init']
        this._currentStage = 'init'

        this.eventEmitter = new EventEmitter()
        this.composers = []

        this.fileInjector = new FileInjectors.LiquidInjector()
        this.nameInjector = new NameInjectors.LiquidInjector()

        this.paths = new ForgePaths()
        this.program = new ForgeProgram(this)
        this.variables = new ForgeVariables(this)
        this.prompts = new ForgePrompts(this)
        this.config = new ForgeConfig(this)
        this.fs = new ForgeFs(this)
        this.memFs = new MemForgeFs(this)
    }

    setStage(stage: ForgeStages) {
        if (this.currentStage == stage)
            return

        this.stageHistory.push(stage)
        this._currentStage = stage
    }
}
