import { ConfigObject } from "../../../forge/ForgeConfig"
import { ConfigScope } from "../../../types"
import { readConfigSync } from "../readConfigSync/readConfigSync"
import { writeConfigSync } from "../writeConfigSync/writeConfigSync"

export interface DeleteConfigSyncArgs {
    directory: string
    key: string
    scope: ConfigScope
    forgeId?: string
    taskId?: string
}

export function deleteConfigSync(args: DeleteConfigSyncArgs) {
    let config = readConfigSync(args.directory)
    if (!config)
        return

    const newConfig = deleteInternal(config, args)
    writeConfigSync(args.directory, newConfig)
}

function deleteInternal(config: ConfigObject, args: DeleteConfigSyncArgs) {
    let obj: any
    if (args.scope == 'task') {
        if (!args.forgeId) {
            throw new Error('ForgeId required')
        }

        if (!args.taskId) {
            throw new Error('TaskId required')
        }

        obj = config?.taskScope?.[args.forgeId]?.[args.taskId]
    } else if (args.scope == 'forge') {
        if (!args.forgeId) {
            throw new Error('ForgeId required')
        }

        obj = config?.forgeScope?.[args.forgeId]
    } else {
        obj = config?.projectScope
    }

    if (!obj || !(args.key in obj)) {
        return config
    }

    delete obj[args.key]

    return config
}