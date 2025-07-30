import { RebuildStrategy } from "@/utils/Types"

export interface ClonedRepositories {
    id: string
    repo: string
    branch: string
    commit: string
    shortCommit: string
}

export interface InstalledForge {
    id: string
    directory: string
    repositoryId?: string
    rebuildStrategy?: RebuildStrategy
}

export interface ConfigObject {
    forges: Record<string, InstalledForge>
    repositories: ClonedRepositories[]
}

export interface TaskInfo {
    id: string
    name: string
    filePath: string,
    default: boolean,
    description?: string
}

export interface ForgeInfo {
    id: string
    name: string
    isTypescript: boolean
    distExist: boolean
    directory: string
    tasks: TaskInfo[]
    description?: string
    rebuildStrategy?: RebuildStrategy
}
