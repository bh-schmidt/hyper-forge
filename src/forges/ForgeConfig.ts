import { ConfigScope } from '@/forges/Types'
import { VariablesTypes } from '@/forges/VariableMapper'
import { dirname } from 'path'
import { createConfig } from '../use-cases/config/createConfig/createConfig'
import { deleteConfig } from '../use-cases/config/deleteConfig/deleteConfig'
import { getConfigValues } from '../use-cases/config/getConfigValues/getConfigValues'
import { getParentConfigs } from '../use-cases/config/getParentConfigs/getParentConfigs'
import { setConfigValues } from '../use-cases/config/setConfigValues/setConfigValues'
import { Forge } from './Forge'

export interface ForgeConfigOptions {
    /** Whether the config should be automatically generated in the commit stage. */
    autoSave?: boolean
    /** Whether to read and merge configs from parent directories */
    recursiveValues?: boolean
}

interface ConfigValues {
    [key: string]: any
}

interface TaskValues {
    [taskId: string]: ConfigValues
}

interface TaskContext {
    [forgeId: string]: TaskValues
}

interface ForgeContext {
    [forgeId: string]: ConfigValues
}

export interface ConfigObject {
    /** Project configuration values shared across all tasks. */
    projectScope?: ConfigValues
    /** Task-specific configuration values, keyed by task name. */
    taskScope?: TaskContext
    /** Forge-specific configuration values, keyed by task name. */
    forgeScope?: ForgeContext
}

export interface GetValueOptions<TKey> {
    key: TKey
    scope?: ConfigScope
    forgeId?: string
    taskId?: string
    directory?: string
    recursive?: boolean
}

export interface GetValuesOptions {
    scope?: ConfigScope
    forgeId?: string
    taskId?: string
    directory?: string
    recursive?: boolean
}

export interface SetValueOptions<TKey> {
    key: TKey
    value: any
    scope: ConfigScope
    forgeId?: string
    taskId?: string
    directory?: string
}

export interface SetValuesOptions<TVariables extends VariablesTypes> {
    values: Partial<TVariables>
    scope: ConfigScope
    forgeId?: string
    taskId?: string
    directory?: string
}

export interface DeleteValueOptions<TKey> {
    key: TKey
    scope: ConfigScope
    forgeId?: string
    taskId?: string
    directory?: string
}

export class ForgeConfig<TVariables extends VariablesTypes> {
    private configDirectory?: string

    /** Config behavior options. */
    _options: ForgeConfigOptions = {
        autoSave: false,
        recursiveValues: true
    }

    constructor(private forge: Forge) { }

    async get<K extends Extract<keyof TVariables, string> = Extract<keyof TVariables, string>>(options: GetValueOptions<K>): Promise<K extends keyof TVariables ? TVariables[K] : any> {
        const values = await getConfigValues({
            scope: options.scope,
            directory: options.directory ?? await this.getConfigDirectory(),
            forgeId: options.forgeId ?? this.forge.id,
            taskId: options.taskId ?? this.forge.taskId,
            recursive: options.recursive ?? this._options.recursiveValues,
        })

        if (this.forge.variables.mapper.isMapped(options.key)) {
            return await this.forge.variables.mapper.parse(options.key as any, values[options.key])
        }
        else {
            return values[options.key]
        }
    }

    async getValues<T = TVariables>(options?: GetValuesOptions): Promise<T> {
        options ??= {}

        const values = await getConfigValues<T>({
            scope: options.scope,
            directory: options.directory ?? await this.getConfigDirectory(),
            forgeId: options.forgeId ?? this.forge.id,
            taskId: options.taskId ?? this.forge.taskId,
            recursive: options.recursive ?? this._options.recursiveValues,
        })

        const newValues: Record<string, any> = {}
        for (const [key, value] of Object.entries(values as Record<string, any>)) {
            if (this.forge.variables.mapper.isMapped(key)) {
                newValues[key] = await this.forge.variables.mapper.parse(key as any, value)
            }
            else {
                newValues[key] = value
            }
        }

        return newValues as T
    }

    async set<K extends Extract<keyof TVariables, string> = Extract<keyof TVariables, string>>(options: SetValueOptions<K>) {
        await this.setValues(
            {
                ...options,
                values: { [options.key]: options.value } as TVariables
            }
        )
    }

    async setValues(options: SetValuesOptions<TVariables>) {
        const disableSaving = await this.forge.variables.get('DISABLE_SAVING')

        if (disableSaving) {
            return
        }

        options.scope ??= 'task'

        const values: VariablesTypes = {}

        for (const [key, value] of Object.entries(options.values)) {
            values[key] = await this.forge.variables.mapper.parse(key as any, value)
        }

        await setConfigValues({
            scope: options.scope,
            values: options.values,
            directory: options.directory ?? await this.getConfigDirectory(),
            forgeId: options.forgeId ?? this.forge.id,
            taskId: options.taskId ?? this.forge.taskId
        })
    }

    async delete<K extends Extract<keyof TVariables, string>>(options: DeleteValueOptions<K>) {
        const disableSaving =
            await this.forge.variables.get('DISABLE_SAVING') 

        if (disableSaving) {
            return
        }

        options.scope ??= 'task'

        await deleteConfig({
            key: options.key,
            scope: options.scope,
            directory: options.directory ?? await this.getConfigDirectory(),
            forgeId: options.forgeId ?? this.forge.id,
            taskId: options.taskId ?? this.forge.taskId
        })
    }

    async getConfigDirectory() {
        if (this.configDirectory)
            return this.configDirectory

        const targetDir = this.forge.paths.targetPath()
        const paths = await getParentConfigs(targetDir)
        if (paths.length == 0) {
            return targetDir
        }

        const lastPath = paths[paths.length - 1]
        return dirname(lastPath)
    }

    setConfigDirectory(directory: string) {
        this.configDirectory = this.forge.paths.targetPath(directory)
    }

    async configExists() {
        const targetDir = this.forge.paths.targetPath()
        const paths = await getParentConfigs(targetDir)
        return paths.length > 0
    }

    async save() {
        const disableSaving =
            await this.forge.variables.get('DISABLE_SAVING') 

        if (disableSaving) {
            return
        }

        const dir = await this.getConfigDirectory()
        await createConfig(dir)
    }
}