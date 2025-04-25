import { readConfig } from "../readConfig/readConfig";
import { writeConfig } from "../writeConfig/writeConfig";

export async function createConfig(directory: string) {
    let config = await readConfig(directory)
    config ??= {
        forgeScope: {},
        projectScope: {},
        taskScope: {}
    }
    await writeConfig(directory, config)
}