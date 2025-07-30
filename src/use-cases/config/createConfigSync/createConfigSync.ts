import { readConfigSync } from "../readConfigSync/readConfigSync";
import { writeConfigSync } from "../writeConfigSync/writeConfigSync";

export function createConfigSync(directory: string) {
    let config = readConfigSync(directory)
    config ??= {
        forgeScope: {},
        projectScope: {},
        taskScope: {}
    }
    writeConfigSync(directory, config)
}