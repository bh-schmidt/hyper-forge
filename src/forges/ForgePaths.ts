import { isAbsolute, join, resolve } from "path";

export class ForgePaths {
    _rootDir: string = null!
    _sourceDir: string = null!
    _targetDir: string = null!
    _scriptsDir: string = null!
    _tempDir: string = null!

    setRootDir(path: string) {
        if (isAbsolute(path)) {
            this._rootDir = resolve(path)
            return
        }

        this._rootDir = resolve(join(this._rootDir, path))
    }

    setTargetDir(path: string) {
        if (isAbsolute(path)) {
            this._targetDir = resolve(path)
            return
        }

        this._targetDir = resolve(join(this._targetDir, path))
    }

    setSourceDir(path: string) {
        if (isAbsolute(path)) {
            this._sourceDir = resolve(path)
            return
        }

        this._sourceDir = resolve(join(this._sourceDir, path))
    }

    setScriptsDir(path: string) {
        if (isAbsolute(path)) {
            this._scriptsDir = resolve(path)
            return
        }

        this._scriptsDir = resolve(join(this._scriptsDir, path))
    }

    rootPath(...destination: string[]) {
        const path = join(...destination)

        if (isAbsolute(path)) {
            return path
        }

        return resolve(join(this._rootDir, path))
    }

    targetPath(...destination: string[]) {
        const path = join(...destination)

        if (isAbsolute(path)) {
            return path
        }


        return resolve(join(this._targetDir, path))
    }

    sourcePath(...destination: string[]) {
        const path = join(...destination)

        if (isAbsolute(path)) {
            return path
        }

        return resolve(join(this._sourceDir, path))
    }

    scriptsPath(...destination: string[]) {
        const path = join(...destination)

        if (isAbsolute(path)) {
            return path
        }

        return resolve(join(this._scriptsDir, path))
    }

    tempPath(...destination: string[]) {
        const path = join(...destination)

        if (isAbsolute(path)) {
            return path
        }

        return resolve(join(this._tempDir, path))
    }

    cwdPath(...destination: string[]) {
        const path = join(...destination)

        if (isAbsolute(path)) {
            return path
        }

        return resolve(join(process.cwd(), path))
    }
}