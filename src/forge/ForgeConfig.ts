import { dirname } from 'path'
import { ConfigScope } from '../types'
import { createConfig } from '../useCases/config/createConfig/createConfig'
import { deleteConfig } from '../useCases/config/deleteConfig/deleteConfig'
import { deleteConfigSync } from '../useCases/config/deleteConfigSync/deleteConfig'
import { getConfigValues } from '../useCases/config/getConfigValues/getConfigValues'
import { getConfigValuesSync } from '../useCases/config/getConfigValuesSync/getConfigValuesSync'
import { getParentConfigs } from '../useCases/config/getParentConfigs/getParentConfigs'
import { getParentConfigsSync } from '../useCases/config/getParentConfigsSync/getParentConfigsSync'
import { setConfigValues } from '../useCases/config/setConfigValues/setConfigValues'
import { setConfigValuesSync } from '../useCases/config/setConfigValuesSync/setConfigValuesSync'
import { Forge } from './Forge'

/**
 * Options for Config behavior.
 */
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

/**
 * Shape of the configuration object stored in file and memory.
 */
export interface ConfigObject {
    /** Project configuration values shared across all tasks. */
    projectScope?: ConfigValues
    /** Task-specific configuration values, keyed by task name. */
    taskScope?: TaskContext
    /** Forge-specific configuration values, keyed by task name. */
    forgeScope?: ForgeContext
}

/**
 * Handles loading, saving, and manipulating project and task-specific configurations.
 */
export class ForgeConfig {
    private configDirectory?: string

    /** Config behavior options. */
    _options: ForgeConfigOptions = {
        autoSave: false,
        recursiveValues: true
    }

    /**
     * Create a new ForgeConfig instance.
     * @param forge The Forge instance providing context to the config object.
     */
    constructor(private forge: Forge) { }

    /**
     * Retrieve a task-specific configuration value for the current task.
     * @param key Configuration key.
     * @param scope The configuration scope to retrieve the key from. 
     * Can be `'task'` for task-specific settings or `'project'` for project-wide settings.
     * @returns A deep clone of the stored value, or undefined if not found.
     */
    async get<T = any>(key: string, scope?: ConfigScope) {
        const values = await this.getValues(scope)
        return values?.[key] as T | undefined
    }

    /**
     * Retrieve a task-specific configuration value for the current task.
     * @param key Configuration key.
     * @param scope The configuration scope to retrieve the key from. 
     * Can be `'task'` for task-specific settings or `'project'` for project-wide settings.
     * @returns A deep clone of the stored value, or undefined if not found.
     */
    getSync<T = any>(key: string, scope?: ConfigScope) {
        const values = this.getValuesSync(scope)
        return values?.[key] as T | undefined
    }

    /**
     * Get all configuration values for the current task.
     * @param scope The configuration scope to retrieve the key from. 
     * Can be `'task'` for task-specific settings or `'project'` for project-wide settings.
     * @returns A deep clone of the task's config object, or undefined if not set.
     */
    async getValues<T = any>(scope?: ConfigScope) {
        return await getConfigValues({
            directory: await this.getConfigDirectory(),
            forgeId: this.forge.id,
            taskId: this.forge.taskId,
            scope: scope,
            recursive: this._options.recursiveValues,
        })
    }

    /**
     * Get all configuration values for the current task.
     * @param scope The configuration scope to retrieve the key from. 
     * Can be `'task'` for task-specific settings or `'project'` for project-wide settings.
     * @returns A deep clone of the task's config object, or undefined if not set.
     */
    getValuesSync<T = any>(scope?: ConfigScope) {
        return getConfigValuesSync<T>({
            directory: this.getConfigDirectorySync(),
            forgeId: this.forge.id,
            taskId: this.forge.taskId,
            scope: scope,
            recursive: this._options.recursiveValues,
        })
    }

    /**
     * Sets a task-specific configuration value for the current task.
     * @param key The key to set.
     * @param scope The configuration scope to retrieve the key from. 
     * Can be `'task'` for task-specific settings or `'project'` for project-wide settings.
     * @param value The value to associate with the key.
     */
    async set(key: string, value: any, scope: ConfigScope = 'task') {
        await this.setValues(
            { [key]: value },
            scope
        )
    }

    /**
     * Sets a task-specific configuration value for the current task.
     * @param key The key to set.
     * @param scope The configuration scope to retrieve the key from. 
     * Can be `'task'` for task-specific settings or `'project'` for project-wide settings.
     * @param value The value to associate with the key.
     */
    setSync(key: string, value: any, scope: ConfigScope = 'task') {
        this.setValuesSync(
            { [key]: value },
            scope
        )
    }

    /**
     * Sets multiple task-specific configuration values for the current task.
     * @param values An object containing key-value pairs to set.
     * @param scope The configuration scope to retrieve the key from. 
     * Can be `'task'` for task-specific settings or `'project'` for project-wide settings.
     */
    async setValues(values: any, scope: ConfigScope = 'task') {
        const disableSaving =
            this.forge.variables.get('disableSaving') ??
            this.forge.program.options().disableSaving

        if (disableSaving) {
            return
        }

        await setConfigValues({
            directory: await this.getConfigDirectory(),
            scope: scope,
            values: values,
            forgeId: this.forge.id,
            taskId: this.forge.taskId
        })
    }

    /**
     * Sets multiple task-specific configuration values for the current task.
     * @param values An object containing key-value pairs to set.
     * @param scope The configuration scope to retrieve the key from. 
     * Can be `'task'` for task-specific settings or `'project'` for project-wide settings.
     */
    setValuesSync(values: any, scope: ConfigScope = 'task') {
        const disableSaving =
            this.forge.variables.get('disableSaving') ??
            this.forge.program.options().disableSaving

        if (disableSaving) {
            return
        }

        setConfigValuesSync({
            directory: this.getConfigDirectorySync(),
            scope: scope,
            values: values,
            forgeId: this.forge.id,
            taskId: this.forge.taskId
        })
    }

    /**
     * Deletes a task-specific configuration value for the current task.
     * @param scope The configuration scope to retrieve the key from. 
     * Can be `'task'` for task-specific settings or `'project'` for project-wide settings.
     * @param key The key to delete.
     */
    async delete(key: string, scope: ConfigScope = 'task') {
        const disableSaving =
            this.forge.variables.get('disableSaving') ??
            this.forge.program.options().disableSaving

        if (disableSaving) {
            return
        }

        await deleteConfig({
            directory: await this.getConfigDirectory(),
            key: key,
            scope: scope,
            forgeId: this.forge.id,
            taskId: this.forge.taskId
        })
    }

    /**
     * Deletes a task-specific configuration value for the current task.
     * @param scope The configuration scope to retrieve the key from. 
     * Can be `'task'` for task-specific settings or `'project'` for project-wide settings.
     * @param key The key to delete.
     */
    deleteSync(key: string, scope: ConfigScope = 'task') {
        const disableSaving =
            this.forge.variables.get('disableSaving') ??
            this.forge.program.options().disableSaving

        if (disableSaving) {
            return
        }

        deleteConfigSync({
            directory: this.getConfigDirectorySync(),
            key: key,
            scope: scope,
            forgeId: this.forge.id,
            taskId: this.forge.taskId
        })
    }

    /**
     * Gets the path to the current config file, if loaded or saved.
     * @returns The absolute path to the config file, or undefined if not set.
     */
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

    /**
     * Gets the path to the current config file, if loaded or saved.
     * @returns The absolute path to the config file, or undefined if not set.
     */
    getConfigDirectorySync() {
        if (this.configDirectory)
            return this.configDirectory

        const targetDir = this.forge.paths.targetPath()
        const paths = getParentConfigsSync(targetDir)
        if (paths.length == 0) {
            return targetDir
        }

        const lastPath = paths[paths.length - 1]
        return dirname(lastPath)
    }

    setConfigDirectory(directory: string) {
        this.configDirectory = this.forge.paths.targetPath(directory)
    }

    /**
     * Checks if there is an existing config file for target path.
     * 
     * @param directory Optional directory to start the search from. Defaults to the Forge target path.
     * @returns True if a config file was found and loaded, false otherwise.
     */
    async configExists() {
        const targetDir = this.forge.paths.targetPath()
        const paths = await getParentConfigs(targetDir)
        return paths.length > 0
    }

    async save() {
        const disableSaving =
            this.forge.variables.get('disableSaving') ??
            this.forge.program.options().disableSaving

        if (disableSaving) {
            return
        }

        const dir = await this.getConfigDirectory()
        await createConfig(dir)
    }
}