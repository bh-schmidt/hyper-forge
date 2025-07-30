import { DeleteConfigSyncArgs, deleteConfigSync } from '../use-cases/config/deleteConfigSync/deleteConfig'
import { GetConfigSyncArgs, getConfigSync } from '../use-cases/config/getConfigSync/getConfigSync'
import { GetConfigValuesSyncArgs, getConfigValuesSync } from '../use-cases/config/getConfigValuesSync/getConfigValuesSync'
import { getParentConfigsSync } from '../use-cases/config/getParentConfigsSync/getParentConfigsSync'
import { SetConfigSyncArgs, setConfigSync } from '../use-cases/config/setConfigSync/setConfigSync'

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