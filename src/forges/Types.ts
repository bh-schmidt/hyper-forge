import { ForgeConfig } from "@/forges/ForgeConfig";
import { ForgeFs } from "@/forges/ForgeFs";
import { ForgePaths } from "@/forges/ForgePaths";
import { ForgeProgram } from "@/forges/ForgeProgram";
import { ForgePrompts } from "@/forges/ForgePrompts";
import { ForgeVariables } from "@/forges/ForgeVariables";
import { MemForgeFs } from "@/forges/MemForgeFs";
import { ReservedVariablesTypes, VariablesTypes } from "@/forges/VariableMapper";
import { Globber } from "@/utils/Globber";
import { Command, Option } from "commander";
import { ReadStream } from "fs-extra";

export type PromiseOrValue<T> = T | Promise<T>
export type ForgeEventAction<TVariables extends VariablesTypes> = (forge: IForge<TVariables>) => PromiseOrValue<void>
export type ConfigureCommand = (program: Command) => PromiseOrValue<void>
export type ValidateCommands = (program: Command) => PromiseOrValue<string | true | undefined>
export type ValidateOptions = (option: Option, value: any) => PromiseOrValue<string | true | undefined>

export type Writable<T> = {
    -readonly [P in keyof T]: T[P];
};

export type TempPathType = 'file' | 'directory';
export type FileExistsAction = 'ask' | 'ignore' | 'replace' | 'throw'

export interface IForge<TVariables extends VariablesTypes> {
    id: string
    taskId: string
    stageHistory: ForgeStages[]
    currentStage: ForgeStages

    paths: ForgePaths
    program: ForgeProgram
    fs: ForgeFs
    memFs: MemForgeFs
    variables: ForgeVariables<TVariables & ReservedVariablesTypes>
    prompts: ForgePrompts<TVariables>
    config: ForgeConfig<TVariables & ReservedVariablesTypes>
}

export interface WriteOptions {
    ifFileExists?: FileExistsAction
}

export interface IForgeFs {
    writeFile(path: string, data: string | NodeJS.ArrayBufferView, options?: WriteOptions): Promise<void>
    ensureDirectory(path: string): Promise<void>

    copyFile(src: string, dest: string, options: WriteOptions): Promise<void>
    copyDirectory(src: string, dest: string, options: WriteOptions): Promise<void>

    inject(pattern: string | string[], variables?: any, globOptions?: Globber.GlobOptions, writeOptions?: WriteOptions): Promise<void>
    injectFile(src: string, dest: string, variables: any, writeOptions?: WriteOptions): Promise<void>
    injectDirectory(path: string, variables: any): Promise<void>

    readFileSrc(srcPath: string): Promise<Buffer | undefined>
    readFileTarget(srcPath: string): Promise<Buffer | undefined>

    createReadStreamSrc(path: string): Promise<ReadStream>
    createReadStreamTarget(path: string): Promise<ReadStream>

    existsSrc(path: string): Promise<boolean>
    existsTarget(path: string): Promise<boolean>
}

export type RunCommandOptions<TOptions> = {
    args?: string[]
    execaOptions?: TOptions
    printResult?: boolean
    printCommand?: boolean
    printStdout?: boolean
    printStderr?: boolean
}

export type ForgeStages = 'init' | 'prompt' | 'prepare' | 'write' | 'conflicts' | 'commit' | 'rollback' | 'end'
export type ConfigScope = 'task' | 'forge' | 'project'

const _reservedOptions = [
    'disablePrompts',
    'disablePromptConfirmation',
    'disableSaving',
    'rebuild'
] as const
export const reservedOptions = Object.freeze(_reservedOptions)
export type ReservedOption = typeof reservedOptions[number]
const _reservedOptionsEnum = reservedOptions.reduce((prev, curr) => {
    prev[curr] = curr
    return prev
}, {} as Record<ReservedOption, ReservedOption>)
export const ReservedOptionsEnum = Object.freeze(_reservedOptionsEnum)
export interface OptionsType {
    'rebuild'?: boolean,
    'disablePrompts'?: boolean,
    'disablePromptConfirmation'?: boolean,
    'disableSaving'?: boolean,
    [key: string]: any
}

export type TypeOrLooseType<TVariable extends Record<any, any>, TLoose extends boolean | undefined> =
    TLoose extends true ?
    TVariable & { [key: string & {}]: any } :
    TVariable