export namespace NamingConvention {
    export type ConventionType = 'camelCase'
        | 'PascalCase'
        | 'kebab-case'
        | 'camel-Kebab-Case'
        | 'Pascal-Kebab-Case'
        | 'SCREAMING-KEBAB-CASE'
        | 'snake_case'
        | 'camel_Snake_Case'
        | 'Pascal_Snake_Case'
        | 'SCREAMING_SNAKE_CASE'
        | 'flatcase'
        | 'SCREAMINGFLATCASE'
        | 'dot.case'
        | 'camel.Dot.Case'
        | 'Pascal.Dot.Case'
        | 'SCREAMING.DOT.CASE'
        | 'phrase case'
        | 'camel Phrase Case'
        | 'Pascal Phrase Case'
        | 'SCREAMING PHRASE CASE'

    export function getTokens(text: string) {
        const regex = /(?:\p{Ll}+)|(?:\p{Lu}\p{Ll}+)|(?:\d+)|(?:\p{Lu}+)/gu
        const matches = text.matchAll(regex).toArray()

        const tokens = matches.map(match => {
            return match[0]
        })

        return tokens
    }

    export function convert(text: string, convention: ConventionType) {
        return convertInternal(text, convention, false)
    }

    export function localeConvert(text: string, convention: ConventionType) {
        return convertInternal(text, convention, false)
    }

    function convertInternal(text: string, convention: ConventionType, locale: boolean) {
        if (!convention) {
            throw new Error('conversion is required.')
        }

        if (!text) {
            return undefined
        }

        const tokens = getTokens(text)
        if (tokens.length == 0) {
            return undefined
        }

        if (convention == 'Pascal-Kebab-Case') {
            const nt = tokens.map(e => capitalize(e, locale))
            return nt.join('-')
        }

        if (convention == 'Pascal.Dot.Case') {
            const nt = tokens.map(e => capitalize(e, locale))
            return nt.join('.')
        }

        if (convention == 'Pascal Phrase Case') {
            const nt = tokens.map(e => capitalize(e, locale))
            return nt.join(' ')
        }

        if (convention == 'Pascal_Snake_Case') {
            const nt = tokens.map(e => capitalize(e, locale))
            return nt.join('_')
        }

        if (convention == 'PascalCase') {
            const nt = tokens.map(e => capitalize(e, locale))
            return nt.join('')
        }

        if (convention == 'SCREAMING-KEBAB-CASE') {
            const nt = tokens.map(e => upperCase(e, locale))
            return nt.join('-')
        }

        if (convention == 'SCREAMING.DOT.CASE') {
            const nt = tokens.map(e => upperCase(e, locale))
            return nt.join('.')
        }

        if (convention == 'SCREAMINGFLATCASE') {
            const nt = tokens.map(e => upperCase(e, locale))
            return nt.join('')
        }

        if (convention == 'SCREAMING PHRASE CASE') {
            const nt = tokens.map(e => upperCase(e, locale))
            return nt.join(' ')
        }

        if (convention == 'SCREAMING_SNAKE_CASE') {
            const nt = tokens.map(e => upperCase(e, locale))
            return nt.join('_')
        }

        if (convention == 'camel-Kebab-Case') {
            const nt = tokens.map((e, i) => i == 0 ? lowerCase(e, locale) : capitalize(e, locale))
            return nt.join('-')
        }

        if (convention == 'camel.Dot.Case') {
            const nt = tokens.map((e, i) => i == 0 ? lowerCase(e, locale) : capitalize(e, locale))
            return nt.join('_')
        }

        if (convention == 'camel Phrase Case') {
            const nt = tokens.map((e, i) => i == 0 ? lowerCase(e, locale) : capitalize(e, locale))
            return nt.join(' ')
        }

        if (convention == 'camel_Snake_Case') {
            const nt = tokens.map((e, i) => i == 0 ? lowerCase(e, locale) : capitalize(e, locale))
            return nt.join('_')
        }

        if (convention == 'camelCase') {
            const nt = tokens.map((e, i) => i == 0 ? lowerCase(e, locale) : capitalize(e, locale))
            return nt.join('')
        }

        if (convention == 'dot.case') {
            const nt = tokens.map((e) => lowerCase(e, locale))
            return nt.join('.')
        }

        if (convention == 'flatcase') {
            const nt = tokens.map((e) => lowerCase(e, locale))
            return nt.join('')
        }

        if (convention == 'kebab-case') {
            const nt = tokens.map((e) => lowerCase(e, locale))
            return nt.join('-')
        }

        if (convention == 'phrase case') {
            const nt = tokens.map((e) => lowerCase(e, locale))
            return nt.join(' ')
        }

        if (convention == 'snake_case') {
            const nt = tokens.map((e) => lowerCase(e, locale))
            return nt.join('_')
        }

        return undefined
    }

    function upperCase(text: string, locale: boolean) {
        return locale ?
            text.toLocaleUpperCase() :
            text.toUpperCase()
    }

    function lowerCase(text: string, locale: boolean) {
        return locale ?
            text.toLocaleLowerCase() :
            text.toLowerCase()
    }

    function capitalize(text: string, locale: boolean) {
        return locale ?
            text[0].toLocaleUpperCase() + text.slice(1, text.length).toLocaleLowerCase() :
            text[0].toUpperCase() + text.slice(1, text.length).toLowerCase()
    }
}