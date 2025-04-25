import { dirname, join } from "path"
import { ConfigFileName } from "../constants"
import fs from 'fs-extra'

export async function getParentConfigs(directory: string): Promise<string[]> {
    const filePath = join(directory, ConfigFileName)

    const config = await fs.exists(filePath) ?
        [filePath] :
        []

    const parent = dirname(directory)

    const parentConfigs = parent == directory ?
        [] :
        await getParentConfigs(parent)

    return [
        ...config,
        ...parentConfigs,
    ]
}