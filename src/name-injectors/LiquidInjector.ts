import { NameInjector } from "./Types";

export interface LiquidInjectorOptions {
    injectVariables?: boolean
    removeLiquidSuffix?: boolean
}

export class LiquidInjector implements NameInjector {
    private options: LiquidInjectorOptions
    constructor(options?: LiquidInjectorOptions) {
        this.options = options ??= {}
        options.injectVariables ??= true
        options.removeLiquidSuffix ??= true
    }

    inject(_: string | undefined, targetPath: string, variables: any): string | Promise<string> {
        let value = targetPath

        if (this.options?.removeLiquidSuffix) {
            value = value.replace(/[.]liquid$/g, '')
        }

        if (this.options?.injectVariables) {
            value = value.replaceAll(/{{([^\}]+)}}/g, (match, group) => {
                const name = group?.trim()

                if (name && name in variables) {
                    return variables[group.trim()] ?? ''
                }

                return match
            })
        }

        return value
    }
}