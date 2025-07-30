import { ForgeHandler } from "@/internals/ForgeHandler";
import { HyperForgeData } from "@/internals/HyperForgeData";
import { ForgeError } from "@/Types";

export async function uninstallForge(id: string) {
    const config = await HyperForgeData.readConfig()

    if (!config?.forges?.[id]) {
        throw new ForgeError('This forge does not exist')
    }

    delete config.forges[id]

    await ForgeHandler.deleteOldRepositories(config)
    await HyperForgeData.saveConfig(config)
}