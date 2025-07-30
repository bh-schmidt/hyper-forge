import { Prompts } from "@/utils/Prompts"
import chalk from "chalk"
import moment from "moment"
import prompts from "prompts"

export namespace PromptHelper {
    export function getValue<TMain, TOthers>(valueOrFunc: TMain | TOthers, question: Prompts.PromptObject, values: any) {
        if (!valueOrFunc)
            return undefined

        if (typeof valueOrFunc == 'function') {
            const func = valueOrFunc as Function
            return func(undefined, values, question) as TMain
        }

        return valueOrFunc as TMain
    }

    export async function getValueAsync<TMain, TOthers>(valueOrFunc: TMain | TOthers, question: Prompts.PromptObject, values: any) {
        if (!valueOrFunc)
            return undefined

        if (typeof valueOrFunc == 'function') {
            const func = valueOrFunc as Function
            return await func(undefined, values, question) as TMain
        }

        return valueOrFunc as TMain
    }

    export async function recreateQuestion<T extends string>(question: prompts.PromptObject<T>, values: any, options: Prompts.PromptOptions) {
        const recreated: Prompts.PromptObject<T> = {} as any

        if (question.name) {
            recreated.name = getValue<T, typeof question.name>(question.name, question, values)!
        }

        if (question.type) {
            recreated.type = getValue(question.type, question, values)
        }

        if (question.active) {
            recreated.active = getValue(question.active, question, values)
        }

        if (question.choices) {
            recreated.choices = getValue(question.choices, question, values)
        }

        if (question.float) {
            recreated.float = getValue(question.float, question, values)
        }

        if (question.hint) {
            recreated.hint = getValue(question.hint, question, values)
        }

        if (question.inactive) {
            recreated.inactive = getValue(question.inactive, question, values)
        }

        if (question.increment) {
            recreated.increment = getValue(question.increment, question, values)
        }

        if (question.initial) {
            recreated.initial = await getValueAsync(question.initial, question, values)
        }

        if (question.limit) {
            recreated.limit = getValue(question.limit, question, values)
        }

        if (question.mask) {
            recreated.mask = getValue(question.mask, question, values)
        }

        if (question.max) {
            recreated.max = getValue(question.max, question, values)
        }

        if (question.message) {
            recreated.message = getValue(question.message, question, values)
        }

        if (question.min) {
            recreated.min = getValue(question.min, question, values)
        }

        if (question.round) {
            recreated.round = getValue(question.round, question, values)
        }

        if (question.separator) {
            recreated.separator = getValue(question.separator, question, values)
        }

        if (question.style) {
            recreated.style = getValue(question.style, question, values)
        }

        if (question.warn) {
            recreated.warn = getValue(question.warn, question, values)
        }

        if (question.format) {
            recreated.format = (value) => {
                return question.format!(value, values, question)
            }
        }

        if (question.onState) {
            recreated.onState = (value) => {
                return question.onState!(value, values, question)
            }
        }

        if (question.validate && process.platform !== 'win32') {
            recreated.validate = async (value) => {
                return await question.validate!(value, values, question)
            }
        }

        if (question.instructions) {
            recreated.instructions = question.instructions
        }

        if (question.onRender) {
            recreated.onRender = question.onRender
        }

        if (question.suggest) {
            recreated.suggest = question.suggest
        }

        if (question.stdin) {
            recreated.stdin = question.stdin ?? options.stdin
        }

        if (question.stdout) {
            recreated.stdout = question.stdout ?? options.stdout
        }

        return recreated
    }

    export async function getDefaultValues<T extends string = string>(questions: Prompts.PromptObject<T> | Prompts.PromptObject<T>[], answers?: any): Promise<prompts.Answers<T>> {
        questions = Array.isArray(questions) ? questions : [questions]
        const values = answers ?? {}

        for (const question of questions) {
            const name = getValue<string, typeof question.name>(question.name, question, values)!
            const initial = await getValueAsync(question.initial, question, values)
            const type = getValue(question.type, question, values)

            if (answers && answers[name]) {
                values[name] = answers[name]
                continue
            }

            if (type == 'text') {
                values[name] = initial
                continue
            }

            if (type == 'autocomplete') {
                values[name] = initial
                continue
            }

            if (type == 'confirm') {
                values[name] = initial ?? false
                continue
            }

            if (type == 'date') {
                values[name] = initial ?? new Date()
                continue
            }

            if (type == 'invisible') {
                values[name] = initial
                continue
            }

            if (type == 'list') {
                values[name] = initial ?? []
                continue
            }

            if (type == 'multiselect' || type == 'autocompleteMultiselect') {
                let choices = getValue(question.choices, question, values) as prompts.Choice[] | undefined
                if (!choices) {
                    values[name] = []
                    continue
                }

                const ini = choices.filter(e => e.selected).map((e, i) => e.value ?? i)
                values[name] = ini
                continue
            }

            if (type == 'number') {
                values[name] = initial
                continue
            }

            if (type == 'password') {
                values[name] = initial
                continue
            }

            if (type == 'select') {
                if (!initial) {
                    values[name] = undefined
                    continue
                }

                let choices = getValue(question.choices, question, values) as prompts.Choice[] | undefined
                if (!choices) {
                    values[name] = []
                    continue
                }

                values[name] = choices[initial as number]?.value ?? initial
                continue
            }

            if (type == 'toggle') {
                values[name] = initial ?? false
                continue
            }
        }

        return values
    }

    export async function reprintAnswers<T extends string = string>(questions: Prompts.PromptObject<T>[], answers: any) {
        for (const question of questions) {
            const name = getValue(question.name, question, answers)
            const type = getValue(question.type, question, answers)
            const message = getValue(question.message, question, answers)

            const answer = answers[name]

            if (type == 'text' || type == 'number') {
                console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')} ${answer}`)
                continue
            }

            if (type == 'toggle') {
                const inactive = getValue(question.inactive, question, answers)
                const active = getValue(question.active, question, answers)

                const off = inactive ?? 'off'
                const on = active ?? 'on'

                const first = answer == false ? chalk.cyan.underline(off) : off
                const second = answer == true ? chalk.cyan.underline(on) : on

                console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')} ${first} ${chalk.gray('/')} ${second}`)
                continue
            }

            if (type == 'confirm') {
                const text = answer ? 'yes' : 'no'
                console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')} ${text}`)
                continue
            }

            if (type == 'date') {
                let mask = getValue<string, typeof question.mask>(question.mask, question, answers)
                if (!mask) {
                    mask = 'YYYY-MM-DD HH:mm:ss'
                }

                const text = moment(answer)
                    .format(mask)
                console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')} ${text}`)
                continue
            }

            if (type == 'invisible') {
                console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')}`)
                continue
            }

            if (type == 'password') {
                const text = (answer as string).replaceAll(/./g, '*')
                console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')} ${text}`)
                continue
            }

            if (type == 'list') {
                const text = Array.isArray(answer) ?
                    answer.join(', ') :
                    answer

                console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')} ${text}`)
                continue
            }

            if (type == 'select') {
                const choices = getValue<prompts.Choice[], typeof question.choices>(question.choices, question, answers)!
                if (!choices) {
                    console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')} ${answer}`)
                    continue
                }

                let choice = choices.find(e => e.value == answer)
                if (!choice) {
                    if (typeof answer !== 'number') {
                        console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')} ${answer}`)
                        continue
                    }

                    choice = choices[answer]
                }

                console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')} ${choice.title}`)
                continue
            }

            if (type == 'autocomplete') {
                const choices = getValue<prompts.Choice[], typeof question.choices>(question.choices, question, answers)!
                if (!choices) {
                    console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')} ${answer}`)
                    continue
                }

                let choice =
                    choices.find(e => e.value == answer) ??
                    choices.find(e => e.title == answer)

                if (!choice) {
                    console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')} ${answer}`)
                    continue
                }

                console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')} ${choice.title}`)
                continue
            }

            if (type == 'multiselect' || type == 'autocompleteMultiselect') {
                if (!Array.isArray(answer)) {
                    console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')} ${answer}`)
                    continue
                }

                const choices = getValue<prompts.Choice[], typeof question.choices>(question.choices, question, answers)!
                if (!choices) {
                    console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')} ${answer}`)
                    continue
                }

                const temp = answer.map(a => {
                    let choice = choices.find(e => e.value == answer)
                    if (choice) {
                        return choice.title
                    }

                    if (typeof a == 'number') {
                        return choices[a].title
                    }

                    return a
                })

                const text = temp.join(', ')
                console.log(`${chalk.green('√')} ${chalk.bold(message)} ${chalk.gray('...')} ${text}`)
                continue
            }
        }
    }
}