import { dirname, join } from "path"
import { ConfigFileName } from "../constants"
import fs from 'fs-extra'

export function getParentConfigsSync(directory: string): string[] {
    const filePath = join(directory, ConfigFileName)

    const config = fs.existsSync(filePath) ?
        [filePath] :
        []

    const parent = dirname(directory)

    const parentConfigs = parent == directory ?
        [] :
        getParentConfigsSync(parent)

    return [
        ...parentConfigs,
        ...config,
    ]
}