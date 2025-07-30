import { VariableConfig, VariableMapper, VariablesTypes } from "@/forges/VariableMapper"
import { Forge } from "./Forge"

export interface ForgeVariablesOptions {
    mergeConfigValues?: boolean
}

export class ForgeVariables<TVariables extends VariablesTypes> {
    private variables: Record<string, any>

    mapper: VariableMapper<TVariables>

    _options: ForgeVariablesOptions = {
        mergeConfigValues: true
    }

    constructor(private forge: Forge) {
        this.variables = {}
        this.mapper = new VariableMapper<TVariables>({} as any)
            .options({
                allowUnmapped: true
            })
    }

    private async getVariables() {
        const config = this._options.mergeConfigValues ?
            await this.forge.config.getValues() :
            undefined

        return {
            ...config,
            ...this.variables
        } as Record<string, any>
    }

    async get<K extends Extract<keyof TVariables, string> = Extract<keyof TVariables, string>>(varName: K): Promise<K extends keyof TVariables ? TVariables[K] : any> {
        const values = await this.getVariables()
        return structuredClone(values[varName])
    }

    async getValues<T = TVariables>(): Promise<T> {
        const values = await this.getVariables()
        return structuredClone(values) as T
    }

    async set<K extends Extract<keyof TVariables, string> = Extract<keyof TVariables, string>>(varName: K, value: any) {
        const newValue = await this.mapper.parse(varName, value)
        this.variables[varName] = newValue

        const dependencies = Object.entries(this.mapper.map)
            .filter((entry) => {
                const config = entry[1] as VariableConfig
                return config.source == varName
            })

        for (const [key] of dependencies) {
            const value = await this.get(varName)
            await this.set(key as any, value)
        }
    }

    async setValues(obj: Partial<TVariables>) {
        const entries = Object.entries(obj)

        for (const [key, value] of entries) {
            await this.set(key as any, value)
        }
    }
}