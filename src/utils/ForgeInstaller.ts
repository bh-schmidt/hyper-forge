import { ForgeHandler } from "@/internals/ForgeHandler";
import { HyperForgeData } from "@/internals/HyperForgeData";
import { RebuildStrategy } from "@/utils/Types";

export namespace ForgeInstaller {
    export type InstallationType = 'directory' | 'git'

    export type DirectoryArgs = {
        directory: string
        rebuildStrategy?: RebuildStrategy
    };

    export type InstallDirectoryArgs = DirectoryArgs

    export type RepositoryArgs = {
        repository: string
        branch?: string
        commit?: string
    };

    export type InstallRepositoryArgs = RepositoryArgs & {
        forgeIds?: string[]
    };

    export type ForgeInstallation = ({
        [K in InstallationType]: {
            type: K;
            args: K extends 'git' ? RepositoryArgs : DirectoryArgs;
        }
    }[InstallationType])

    export type InstallOptions = ({
        [K in InstallationType]: {
            type: K;
            args: K extends 'git' ? InstallRepositoryArgs : InstallDirectoryArgs;
            replace?: boolean
        }
    }[InstallationType])

    export async function getForges() {
        const config = await HyperForgeData.readConfig()

        const configForges = Object.values(config.forges)
        const forges: ForgeInstallation[] = configForges
            .map(fc => {
                const repo = fc.repositoryId ?
                    config.repositories.find(r => fc.id == r.id) :
                    undefined

                const type: InstallationType = repo ?
                    'git' :
                    'directory';

                const args = repo ?
                    {
                        repository: repo.repo,
                        branch: repo.branch,
                        commit: repo.commit,
                    } as RepositoryArgs :
                    {
                        directory: fc.directory,
                        rebuildStrategy: fc.rebuildStrategy,
                    } as DirectoryArgs

                const forge: ForgeInstallation = {
                    type: type,
                    args: args as any,
                }

                return forge
            })

        return forges
    }

    export async function installForge(options: InstallOptions) {
        if (options.type == 'directory') {
            await ForgeHandler.installDirForge({
                directory: options.args.directory,
                rebuildStrategy: options.args.rebuildStrategy,
                replace: options.replace
            })
        }
        else {
            await ForgeHandler.installGitForge({
                repository: options.args.repository,
                branch: options.args.branch,
                commit: options.args.commit,
                forgeIds: options.args.forgeIds,
                replace: options.replace
            })
        }
    }

    export async function uninstallForge(forgeId: string) {
        await ForgeHandler.uninstallForge(forgeId)
    }
}