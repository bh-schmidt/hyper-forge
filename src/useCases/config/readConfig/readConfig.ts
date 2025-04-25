import fs from 'fs-extra'
import { ConfigObject } from '../../../forge/ForgeConfig'
import { join } from 'path'
import { ConfigFileName } from '../constants'

export async function readConfig(path: string) {
    path = path.endsWith(ConfigFileName) ?
        path :
        join(path, ConfigFileName)

    if (!await fs.exists(path))
        return undefined

    return await fs.readJSON(path) as ConfigObject
}