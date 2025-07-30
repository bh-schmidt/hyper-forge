import { cloneRepository as _cloneRepository } from "@/use-cases/forges-installation/clone-repository/cloneRepository";
import { deleteOldRepositories as _deleteOldRepositories } from "@/use-cases/forges-installation/delete-old-repositories/deleteOldRepositories";
import { getAvailableForges as _getAvailableForges } from "@/use-cases/forges-installation/get-available-forges/getAvailableForges";
import { getForgesToInstall as _getForgesToInstall } from "@/use-cases/forges-installation/get-forges-to-install/getForgesToInstall";
import { getForgesToReplace as _getForgesToReplace } from "@/use-cases/forges-installation/get-forges-to-replace/getForgesToReplace";
import { installDirForge as _installDirForge } from "@/use-cases/forges-installation/install-dir-forge/installDirForge";
import { installGitForge as _installGitForge } from "@/use-cases/forges-installation/install-git-forge/installGitForge";
import { uninstallForge as _uninstallForge } from "@/use-cases/forges-installation/uninstall-forge/uninstallForge";
import { uninstallMissingForges as _uninstallMissingForges } from "@/use-cases/forges-installation/uninstall-missing-forges/uninstallMissingForges";

export namespace ForgeHandler {
    export const installDirForge = _installDirForge
    export const installGitForge = _installGitForge
    export const deleteOldRepositories = _deleteOldRepositories
    export const getAvailableForges = _getAvailableForges
    export const cloneRepository = _cloneRepository
    export const getForgesToInstall = _getForgesToInstall
    export const getForgesToReplace = _getForgesToReplace
    export const uninstallMissingForges = _uninstallMissingForges
    export const uninstallForge = _uninstallForge
}