import { ConfigObject } from "../../../forge/ForgeConfig"
import { ConfigScope } from "../../../types"
import { getParentConfigs } from "../getParentConfigs/getParentConfigs"
import { readConfig } from "../readConfig/readConfig"

export interface GetConfigValuesArgs {
    directory: string
    scope?: ConfigScope
    forgeId?: string
    taskId?: string
    recursive?: boolean
}

export async function getConfigValues<T = any>(args: GetConfigValuesArgs) {
    let paths = await getParentConfigs(args.directory)
    if (!args.recursive)
        paths = [paths[paths.length - 1]]

    const promises = paths.map(p => readConfig(p))
    const configs = await Promise.all(promises)

    const valuesArray = configs.map(config => getValuesInternal<T>(config, args))
    return Object.assign({}, ...valuesArray) as T
}

function getValuesInternal<T = any>(config: ConfigObject | undefined, args: GetConfigValuesArgs) {
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