import { DeleteConfigSyncArgs, deleteConfigSync } from '../useCases/config/deleteConfigSync/deleteConfig'
import { GetConfigSyncArgs, getConfigSync } from '../useCases/config/getConfigSync/getConfigSync'
import { GetConfigValuesSyncArgs, getConfigValuesSync } from '../useCases/config/getConfigValuesSync/getConfigValuesSync'
import { getParentConfigsSync } from '../useCases/config/getParentConfigsSync/getParentConfigsSync'
import { SetConfigSyncArgs, setConfigSync } from '../useCases/config/setConfigSync/setConfigSync'

export namespace ConfigHandlerSync {
    export async function getConfig<T = any>(args: GetConfigSyncArgs) {
        return getConfigSync<T>(args)
    }

    export async function getConfigValues<T = any>(args: GetConfigValuesSyncArgs) {
        return getConfigValuesSync<T>(args)
    }

    export function setConfig(args: SetConfigSyncArgs) {
        setConfigSync(args)
    }

    export function deleteConfig(args: DeleteConfigSyncArgs) {
        deleteConfigSync(args)
    }

    export function getParentConfigs(directory: string) {
        return getParentConfigsSync(directory)
    }
}