import { HyperForgeData } from '@/internals/HyperForgeData';
import { ConfigObject } from '@/internals/Types';
import fs from 'fs-extra';

export async function deleteOldRepositories(config?: ConfigObject) {
    const internalConfig = config === undefined
    config ??= await HyperForgeData.readConfig()

    const allForges = Object.values(config.forges)
    const reposToDelete = config.repositories.filter(repo => !allForges.some(f => f.repositoryId == repo.id))

    for (const repo of reposToDelete) {
        const index = config.repositories.indexOf(repo)
        config.repositories.splice(index, 1)

        const repoDir = HyperForgeData.getGitForgesPath(repo.id)
        if (await fs.exists(repoDir)) {
            await fs.rm(repoDir, { recursive: true })
        }
    }

    if (internalConfig) {
        await HyperForgeData.saveConfig(config)
    }
}