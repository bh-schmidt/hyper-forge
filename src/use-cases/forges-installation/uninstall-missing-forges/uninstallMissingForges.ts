import { ForgeHandler } from '@/internals/ForgeHandler';
import { HyperForgeData } from '@/internals/HyperForgeData';
import fs from 'fs-extra';

export async function uninstallMissingForges() {
    const config = await HyperForgeData.readConfig()
    const forges = Object.values(config.forges)

    for (const forge of forges) {
        if (await fs.exists(forge.directory)) {
            continue
        }

        delete config.forges[forge.id]
    }

    await ForgeHandler.deleteOldRepositories(config)
    await HyperForgeData.saveConfig(config)
}