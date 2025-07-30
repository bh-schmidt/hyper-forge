import { ForgeInfo } from "@/internals/Types"

export async function getForgesToInstall(availableForges: ForgeInfo[], forgeIds: string[] | undefined) {
    if (!forgeIds) {
        return availableForges
    }

    if (forgeIds.some(e => e == '*'))
        return availableForges

    return availableForges.filter(e => forgeIds!.includes(e.id))
}
