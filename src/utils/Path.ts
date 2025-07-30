import { tmpdir } from "os"
import { isAbsolute, join } from "path"

export namespace Path {
    export function isDirectory(path: string) {
        return path.endsWith('\\') || path.endsWith('/')
    }

    export function tempPath(...path: string[]) {
        const p = join(...path)

        if (isAbsolute(p))
            throw 'the provided path is absolute'

        return join(tmpdir(), 'hyper-forge', p)
    }
}