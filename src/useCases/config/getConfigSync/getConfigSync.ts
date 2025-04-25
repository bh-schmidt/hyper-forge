import { ConfigScope } from "../../../types"
import { getConfigValuesSync } from "../getConfigValuesSync/getConfigValuesSync"

export interface GetConfigSyncArgs {
    directory: string
    key: string
    forgeId?: string
    taskId?: string
    scope?: ConfigScope
    recursive?: boolean
}

export function getConfigSync<T = any>(args: GetConfigSyncArgs) {
    const values = getConfigValuesSync(args)
    return values?.[args.key] as T | undefined
}