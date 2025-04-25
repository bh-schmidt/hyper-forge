import { join } from "path";
import { ConfigObject } from "../../../forge/ForgeConfig";
import { ConfigFileName } from "../constants";
import fs from 'fs-extra'

export function writeConfigSync(dir: string, config: ConfigObject) {
    const file = join(dir, ConfigFileName)

    fs.ensureDirSync(dir)
    fs.writeJSONSync(
        file,
        config,
        {
            spaces: 2
        })
}