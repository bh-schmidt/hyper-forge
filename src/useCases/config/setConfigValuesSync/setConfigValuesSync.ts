import { ConfigObject } from "../../../forge/ForgeConfig"
import { ConfigScope } from "../../../types"
import { readConfigSync } from "../readConfigSync/readConfigSync"
import { writeConfigSync } from "../writeConfigSync/writeConfigSync"

export interface SetConfigValuesSyncArgs {
    directory: string
    values: any
    scope: ConfigScope
    forgeId?: string
    taskId?: string
}

export function setConfigValuesSync(args: SetConfigValuesSyncArgs) {
    let config = readConfigSync(args.directory)
    const newConfig = setValuesInternal(config, args)
    writeConfigSync(args.directory, newConfig)
}

function setValuesInternal(config: ConfigObject | undefined, args: SetConfigValuesSyncArgs) {
    config ??= {}
    config.taskScope ??= {}
    config.forgeScope ??= {}
    config.projectScope ??= {}

    let obj: any
    if (args.scope == 'task') {
        if (!args.forgeId) {
            throw new Error('ForgeId required')
        }

        if (!args.taskId) {
            throw new Error('TaskId required')
        }

        config.taskScope[args.forgeId] ??= {}
        obj = config.taskScope[args.forgeId][args.taskId] ??= {}
    } else if (args.scope == 'forge') {
        if (!args.forgeId) {
            throw new Error('ForgeId required')
        }

        obj = config.forgeScope[args.forgeId] ??= {}
    } else {
        obj = config.projectScope
    }

    const entries = Object.entries(args.values)
    for (const [key, value] of entries) {
        obj[key] = value
    }

    return config
}