import { ConfigScope } from "../../../types"
import { getConfigValues } from "../getConfigValues/getConfigValues"

export interface GetConfigArgs {
    directory: string
    key: string
    forgeId?: string
    taskId?: string
    scope?: ConfigScope
    recursive?: boolean
}

export async function getConfig<T = any>(args: GetConfigArgs) {
    const values = await getConfigValues(args)
    return values?.[args.key] as T | undefined
}