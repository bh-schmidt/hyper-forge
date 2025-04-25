import { join } from "path"
import { ConfigScope } from "../../../types"
import { readConfig } from "../readConfig/readConfig"
import { ConfigFileName } from "../constants"
import { ConfigObject } from "../../../forge/ForgeConfig"
import { writeConfig } from "../writeConfig/writeConfig"

export interface SetConfigValuesArgs {
    directory: string
    values: any
    scope: ConfigScope
    forgeId?: string
    taskId?: string
}

export async function setConfigValues(args: SetConfigValuesArgs) {
    let config = await readConfig(args.directory)
    const newConfig = setValuesInternal(config, args)
    await writeConfig(args.directory, newConfig)
}

function setValuesInternal(config: ConfigObject | undefined, args: SetConfigValuesArgs) {
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