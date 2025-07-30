import { DeleteConfigArgs, deleteConfig as deleteConfigUseCase } from '../use-cases/config/deleteConfig/deleteConfig'
import { GetConfigArgs, getConfig as getConfigUseCase } from '../use-cases/config/getConfig/getConfig'
import { GetConfigValuesArgs, getConfigValues as getConfigValuesUseCase } from '../use-cases/config/getConfigValues/getConfigValues'
import { getParentConfigs as getParentConfigsUseCase } from '../use-cases/config/getParentConfigs/getParentConfigs'
import { SetConfigArgs, setConfig as setConfigUseCase } from '../use-cases/config/setConfig/setConfig'

export namespace ConfigHandler {
    export async function getConfig<T = any>(args: GetConfigArgs) {
        return getConfigUseCase<T>(args)
    }

    export async function getConfigValues<T = any>(args: GetConfigValuesArgs) {
        return getConfigValuesUseCase<T>(args)
    }

    export async function setConfig(args: SetConfigArgs) {
        await setConfigUseCase(args)
    }

    export async function deleteConfig(args: DeleteConfigArgs) {
        await deleteConfigUseCase(args)
    }

    export async function getParentConfigs(directory: string) {
        return await getParentConfigsUseCase(directory)
    }
}