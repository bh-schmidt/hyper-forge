import { ConfigScope } from "../../../types"
import { setConfigValuesSync } from "../setConfigValuesSync/setConfigValuesSync"

export interface SetConfigSyncArgs {
    directory: string
    key: string
    value: any
    scope: ConfigScope
    forgeId?: string
    taskId?: string
}

export function setConfigSync(args: SetConfigSyncArgs) {
    setConfigValuesSync({
        directory: args.directory,
        values: {
            [args.key]: args.value
        },
        scope: args.scope,
        forgeId: args.forgeId,
        taskId: args.taskId
    })
}