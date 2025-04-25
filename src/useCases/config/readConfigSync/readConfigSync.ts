import fs from 'fs-extra'
import { ConfigObject } from '../../../forge/ForgeConfig'
import { join } from 'path'
import { ConfigFileName } from '../constants'

export function readConfigSync(path: string) {
    path = path.endsWith(ConfigFileName) ?
        path :
        join(path, ConfigFileName)

    if (!fs.existsSync(path))
        return undefined

    return fs.readJSONSync(path) as ConfigObject
}