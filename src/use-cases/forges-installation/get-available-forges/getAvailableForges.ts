import { HyperForgeData } from "@/internals/HyperForgeData"
import { ClonedRepositories, ConfigObject, ForgeInfo } from "@/internals/Types"
import { Globber } from "@/utils/Globber"

export async function getAvailableForges(repository: ClonedRepositories, config: ConfigObject) {
    const clonePath = HyperForgeData.getGitForgesPath(repository.id)
    const rootForge = await Globber.exists('package.json', { cwd: clonePath })
    const foundPaths: string[] = []

    if (rootForge) {
        foundPaths.push(clonePath)
    } else {
        const dirs = Globber.iterator('*', {
            cwd: clonePath,
            nofiles: true,
            absolute: true
        })

        for await (const dir of dirs) {
            foundPaths.push(dir)
        }
    }

    const availableForges: ForgeInfo[] = []
    for (const path of foundPaths) {
        const forge = await HyperForgeData.readForgeDir(path)
        if (!forge) {
            continue
        }

        if (forge.id in config.forges && config.forges[forge.id].repositoryId == repository.id) {
            continue
        }

        availableForges.push(forge)
    }

    return availableForges
}
