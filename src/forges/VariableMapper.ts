import { TypeOrLooseType } from "@/forges/Index";
import z, { ZodType } from "zod";

export interface VariableConfig {
    parser?: ZodType
    description?: string
    source?: string
}

export interface ReservedVariableConfig extends VariableConfig {
    isReserved: boolean
}

export type VariableMap = Record<string, VariableConfig>
export type ReservedVariableMap = Record<string, ReservedVariableConfig>
export type VariablesTypes = Record<string, any>
export type VariablesTypesExtractor<TVariables extends VariableMap> = {
    [K in keyof TVariables]: 'parser' extends keyof TVariables[K] ?
    z.infer<TVariables[K]['parser']> :
    any
}

function buildVariables<TVariables extends ReservedVariableMap>(vars: TVariables) {
    return vars
}

export const reservedVariablesMap = buildVariables({
    INITIAL_DIRECTORY: {
        isReserved: true,
        parser: z.string().optional(),
        description: 'Sets the initial directory (absolute or relative to CWD) in which the forge will be executed.',
    },
    SKIP_STAGES: {
        isReserved: true,
        parser: z.union([
            z.string(),
            z.array(z.string())
        ]).optional(),
        description: 'List of stages that should be skipped when executting the forge.'
    },
    DISABLE_PROMPTS: {
        isReserved: true,
        parser: z.coerce.boolean().optional(),
        description: 'Disables any prompts during the execution of the forge.'
    },
    DISABLE_PROMPT_CONFIRMATION: {
        isReserved: true,
        parser: z.coerce.boolean().optional(),
        description: 'Disables any prompt confirmation during the execution of the forge.'
    },
    SKIP_PROMPTS: {
        isReserved: true,
        parser: z.union([
            z.string(),
            z.array(z.string())
        ]).optional(),
        description: 'List of prompt names that should be skipped during the execution of the forge.'
    },
    DISABLE_SAVING: {
        isReserved: true,
        parser: z.coerce.boolean().optional(),
        description: 'Disables saving any configuration during the execution.'
    }
})

export type ReservedVariablesMap = typeof reservedVariablesMap
export type ReservedVariables = keyof ReservedVariablesMap
export const reservedVariables = Object.keys(reservedVariablesMap)
export type ReservedVariablesTypes = VariablesTypesExtractor<ReservedVariablesMap>
export interface VariableMapperOptions {
    allowUnmapped?: boolean
}
export class VariableMapper<TVariables extends VariableMap, TOptions extends VariableMapperOptions = VariableMapperOptions> {
    readonly map: TVariables & ReservedVariablesMap
    readonly keys: (keyof TVariables)[]
    private _options: TOptions = {} as any

    constructor(variables: TVariables) {
        const newVariables = {
            ...reservedVariablesMap,
        } as any

        const keys: (keyof TVariables)[] = Object.keys(newVariables) as any

        const entries = Object.entries(variables)
        for (const [key, config] of entries) {
            if (typeof key !== 'string') {
                throw new Error(`Can't map a non-string variable: '${key}'`)
            }

            if (key in newVariables) {
                throw new Error(`Variable '${key}' was already registered.`)
            }

            newVariables[key] = config
            keys.push(key as any)
        }

        this.map = newVariables as any
        this.keys = keys
    }

    options<TNew extends VariableMapperOptions>(options: TNew) {
        this._options = {
            ...options
        } as any
        return this as any as VariableMapper<TVariables, TNew>
    }

    isMapped<T extends string>(key: T) {
        return key in this.map
    }

    get(key: keyof TypeOrLooseType<TVariables, TOptions['allowUnmapped']>) {
        return this.map[key]
    }

    async parse(key: keyof TypeOrLooseType<TVariables, TOptions['allowUnmapped']>, value: any) {
        const clone = structuredClone(value)

        const variable = this.map[key]
        if (!variable) {
            if (this._options.allowUnmapped)
                return clone

            throw new Error(`Trying to parse unmapped variable '${key.toString()}'.`)
        }

        if (!variable.parser) {
            return clone
        }

        return await variable.parser.parseAsync(clone)
    }

    async validate(key: keyof TypeOrLooseType<TVariables, TOptions['allowUnmapped']>, value: any) {
        const variable = this.map[key]
        if (!variable) {
            if (this._options.allowUnmapped)
                return true

            throw new Error(`Trying to validate unmapped variable '${key.toString()}'.`)
        }

        if (!variable.parser) {
            return true
        }

        const result = await variable.parser.safeParseAsync(value)
        if (result.success) {
            return true
        }

        return result.error.issues[0].message
    }
}
