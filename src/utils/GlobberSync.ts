import { GlobOptions as BaseGlobOptions, globStreamSync, Path } from "glob";

export namespace GlobberSync {
    type Result<TOptions extends GlobOptions> = TOptions['withFileTypes'] extends true ? Path : string

    export interface GlobOptions extends BaseGlobOptions {
        nofiles?: boolean
    }

    export function* iterator<TOptions extends GlobOptions = GlobOptions>(
        pattern: string | string[],
        options: TOptions = {} as any
    ) {
        pattern = Array.isArray(pattern) ? pattern : [pattern]
        if (options?.nofiles) {
            pattern = pattern.map(p => {
                return p.endsWith('/') ?
                    p :
                    p + '/'
            })
        }

        options = {
            ...options,
            mark: true,
            stat: true,
            dot: true
        }

        const stream = globStreamSync(pattern, options)

        for (const item of stream) {
            yield item as Result<TOptions>
        }
    }

    export function getAll<TOptions extends GlobOptions = GlobOptions>(pattern: string | string[], options: TOptions = {} as any) {
        const str = iterator(pattern, options)

        const paths: Result<TOptions>[] = []
        for (const path of str) {
            paths.push(path)
        }

        return paths
    }

    export function exists(pattern: string | string[], options: GlobOptions = {}) {
        const paths = iterator(pattern, options)

        for (const _ of paths) {
            return true
        }

        return false
    }
}