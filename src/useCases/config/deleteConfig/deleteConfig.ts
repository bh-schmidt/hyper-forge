import { join } from "path"
import { ConfigScope } from "../../../types"
import { ConfigFileName } from "../constants"
import { readConfig } from "../readConfig/readConfig"
import { ConfigObject } from "../../../forge/ForgeConfig"
import { writeConfig } from "../writeConfig/writeConfig"

export interface DeleteConfigArgs {
    directory: string
    key: string
    scope: ConfigScope
    forgeId?: string
    taskId?: string
}

export async function deleteConfig(args: DeleteConfigArgs) {
    let config = await readConfig(args.directory)
    if (!config)
        return

    const newConfig = deleteInternal(config, args)
    await writeConfig(args.directory, newConfig)
}

function deleteInternal(config: ConfigObject, args: DeleteConfigArgs) {
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