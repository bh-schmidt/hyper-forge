import { ConfigObject } from "../../../forge/ForgeConfig"
import { ConfigScope } from "../../../types"
import { getParentConfigsSync } from "../getParentConfigsSync/getParentConfigsSync"
import { readConfigSync } from "../readConfigSync/readConfigSync"

export interface GetConfigValuesSyncArgs {
    directory: string
    forgeId?: string
    taskId?: string
    scope?: ConfigScope
    recursive?: boolean
}

export function getConfigValuesSync<T = any>(args: GetConfigValuesSyncArgs) {
    let paths = getParentConfigsSync(args.directory)
    if (!args.recursive)
        paths = [paths[paths.length - 1]]

    const configs = paths.map(p => readConfigSync(p))

    const valuesArray = configs.map(config => getValuesInternal<T>(config, args))
    return Object.assign({}, ...valuesArray) as T
}

function getValuesInternal<T = any>(config: ConfigObject | undefined, args: GetConfigValuesSyncArgs) {
    if (args.scope == 'task') {
        if (!args.forgeId) {
            throw new Error('ForgeId required')
        }

        if (!args.taskId) {
            throw new Error('TaskId required')
        }

        return structuredClone(config?.taskScope?.[args.forgeId]?.[args.taskId]) as T | undefined
    }

    if (args.scope == 'forge') {
        if (!args.forgeId) {
            throw new Error('ForgeId required')
        }

        return structuredClone(config?.forgeScope?.[args.forgeId]) as T | undefined
    }

    if (args.scope == 'project')
        return structuredClone(config?.projectScope) as T | undefined

    if (!args.forgeId) {
        throw new Error('ForgeId required')
    }

    if (!args.taskId) {
        throw new Error('TaskId required')
    }
    return {
        ...structuredClone(config?.projectScope),
        ...structuredClone(config?.forgeScope?.[args.forgeId]),
        ...structuredClone(config?.taskScope?.[args.forgeId]?.[args.taskId])
    } as T | undefined
}