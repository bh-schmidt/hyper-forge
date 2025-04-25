import { ConfigScope } from "../../../types"
import { setConfigValues } from "../setConfigValues/setConfigValues"

export interface SetConfigArgs {
    directory: string
    key: string
    value: any
    scope: ConfigScope
    forgeId?: string
    taskId?: string
}

export async function setConfig(args: SetConfigArgs) {
    await setConfigValues({
        directory: args.directory,
        values: {
            [args.key]: args.value
        },
        scope: args.scope,
        forgeId: args.forgeId,
        taskId: args.taskId
    })
}