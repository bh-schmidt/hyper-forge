import { ForgeHandler } from "@/internals/ForgeHandler"
import { HyperForgeData } from "@/internals/HyperForgeData"
import { ForgeError } from "@/Types"
import { RebuildStrategy } from "@/utils/Types"
import fs from 'fs-extra'
import { join, resolve } from "path"

export interface InstallOptions {
    directory: string
    replace?: boolean
    rebuildStrategy?: RebuildStrategy
}

export async function installDirForge(options: InstallOptions) {
    const directory = resolve(options.directory)

    await validateDirectory(directory)

    const config = await HyperForgeData.readConfig()
    const forge = await HyperForgeData.readForgeDir(directory)
    if (!forge) {
        throw new ForgeError(`No forge found in this directory`)
    }

    const existingForge = config.forges[forge.id]
    if (existingForge && existingForge.directory == directory && existingForge.rebuildStrategy == options.rebuildStrategy) {
        return
    }

    if (existingForge && existingForge.directory != directory && !options.replace) {
        throw new ForgeError(`The forge ${forge.id} already exists`)
    }

    config.forges[forge.id] = {
        id: forge.id,
        directory: directory,
        rebuildStrategy: forge.isTypescript ?
            options.rebuildStrategy ?? 'dist-missing' :
            undefined
    }

    await ForgeHandler.deleteOldRepositories(config)
    await HyperForgeData.saveConfig(config)
}

async function validateDirectory(dir: string) {
    if (!dir || dir.trim() === '') {
        throw new ForgeError('Directory is required')
    }

    try {
        if (!await fs.exists(dir)) {
            throw new ForgeError('Directory does not exist')
        }

        const packageJson = join(dir, 'package.json')
        if (!await fs.exists(packageJson)) {
            throw new ForgeError('There is no package.json in this directory')
        }

        const json = await fs.readJson(packageJson)
        if (!json?.name) {
            throw new ForgeError('The package.json has no name')
        }
    } catch (error) {
        if (error instanceof ForgeError) {
            throw error
        }

        throw new ForgeError('Invalid directory')
    }
}