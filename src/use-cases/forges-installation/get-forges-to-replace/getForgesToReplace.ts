import { ClonedRepositories, ConfigObject, ForgeInfo } from "@/internals/Types";

export async function getForgesToReplace(forges: ForgeInfo[], repository: ClonedRepositories, config: ConfigObject) {
    return forges.filter(f => f.id in config.forges && config.forges[f.id].repositoryId != repository.id)
}