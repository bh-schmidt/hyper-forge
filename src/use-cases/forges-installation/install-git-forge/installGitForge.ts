import { ForgeHandler } from "@/internals/ForgeHandler";
import { HyperForgeData } from "@/internals/HyperForgeData";
import { ClonedRepositories, ConfigObject } from "@/internals/Types";
import { ForgeError } from "@/Types";
import fs from 'fs-extra';

export interface InstallOptions {
    repository: string
    forgeIds?: string[]
    branch?: string
    commit?: string
    replace?: boolean
}

export async function installGitForge(options: InstallOptions) {
    let repository: ClonedRepositories | undefined
    let repositoryExists = false
    try {
        const config = await HyperForgeData.readConfig()
        repository = await ForgeHandler.cloneRepository(options, config)

        repositoryExists = config.repositories.some(e => e.id == repository!.id)

        await installInternal(repository, config, options)

        if (!repositoryExists) {
            config.repositories.push(repository)
        }

        await ForgeHandler.deleteOldRepositories(config)
        await HyperForgeData.saveConfig(config)
    } catch (error) {
        if (repository) {
            const path = HyperForgeData.getGitForgesPath(repository.id)
            if (!repositoryExists && await fs.exists(path)) {
                await fs.rm(path, { recursive: true })
            }
        }

        throw error
    }
}

async function installInternal(repository: ClonedRepositories, config: ConfigObject, options: InstallOptions) {
    const availableForges = await ForgeHandler.getAvailableForges(repository, config)
    if (availableForges.length == 0) {
        throw new ForgeError('No available forges found in this repository.')
    }

    const forgesToInstall = await ForgeHandler.getForgesToInstall(availableForges, options.forgeIds)
    if (forgesToInstall.length == 0) {
        throw new ForgeError('No forge selected.')
    }

    const forgesToReplace = await ForgeHandler.getForgesToReplace(forgesToInstall, repository, config)
    if (forgesToReplace.length > 0 && !options.replace) {
        const text = '\t' + forgesToReplace
            .map(e => e.id)
            .join('\n\t')

        throw new ForgeError('There following forges conflict with already installed forges:', text)
    }

    for (const forge of forgesToInstall) {
        config.forges[forge.id] = {
            id: forge.id,
            directory: forge.directory,
            repositoryId: repository.id,
            rebuildStrategy: forge.isTypescript ?
                'dist-missing' :
                undefined
        }
    }
}