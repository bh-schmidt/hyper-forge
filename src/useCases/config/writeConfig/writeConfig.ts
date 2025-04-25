import { join } from "path";
import { ConfigObject } from "../../../forge/ForgeConfig";
import { ConfigFileName } from "../constants";
import fs from 'fs-extra'

export async function writeConfig(dir: string, config: ConfigObject) {
    const file = join(dir, ConfigFileName)

    await fs.ensureDir(dir)
    await fs.writeJSON(
        file,
        config,
        {
            spaces: 2
        })
}