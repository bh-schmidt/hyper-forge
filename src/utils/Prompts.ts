import { PromptHelper } from "@/internals/PromptHelper"
import chalk from "chalk"
import lodash from 'lodash'
import prompts from "prompts"
import Stream from "stream"

const defaultOptions: Prompts.PromptOptions = {
    clearBeforeConfirmations: true,
    clearBetweenQuestions: true,
    maxReprintCount: 10,
    reprintBeforeConfirmations: true,
    reprintBetweenQuestions: true,
}

export namespace Prompts {
    export interface PromptObject<T extends string = string> extends prompts.PromptObject<T> { }

    export interface PromptOptions {
        answers?: any
        clearBetweenQuestions?: boolean
        reprintBetweenQuestions?: boolean
        clearBeforeConfirmations?: boolean
        reprintBeforeConfirmations?: boolean
        maxReprintCount?: number
        useConfirmation?: boolean
        stdin?: Stream.Readable
        stdout?: Stream.Readable
    }

    interface PromptResult<T extends string = string> {
        answers: prompts.Answers<T>
        askedSomething: boolean
    }

    async function promptInternal<T extends string = string>(questions: PromptObject<T>[], options?: PromptOptions): Promise<PromptResult<T>> {
        options = {
            ...defaultOptions,
            ...options
        }

        const answers = options.answers ?? {}

        const [finished, pending] = lodash.partition(questions, question => {
            const name = PromptHelper.getValue<string, typeof question.name>(question.name, question, answers)!
            return name in answers
        })

        const newAnswers = answers as any
        let error: string | undefined
        const pendingItemsCount = pending.length

        while (true) {
            if (options.clearBetweenQuestions) {
                console.clear()
            }

            if (options.reprintBetweenQuestions) {
                const reprint = lodash.takeRight(finished, options.maxReprintCount)
                await PromptHelper.reprintAnswers(reprint, answers)
            }

            if (error) {
                console.log(chalk.red(error))
            }

            if (pending.length == 0) {
                break
            }

            const question = pending.shift()!
            const recreatedQuestion = await PromptHelper.recreateQuestion(question, newAnswers, options)
            const name = PromptHelper.getValue<string, typeof question.name>(question.name, question, newAnswers)!
            const result = await prompts<T>(recreatedQuestion) as any

            if (recreatedQuestion.type !== false && !(name! in result)) {
                process.exit()
            }

            // prompts has a bug on windows that stops reading stdin when the question.validate is async, to fix the issue we manually validate and print the error 
            if (process.platform === 'win32' && question.validate) {
                const valid = await question.validate(result[name!], newAnswers, question)

                if (valid === false) {
                    error = 'Invalid answer'
                    pending.unshift(question)
                    continue
                }

                if (valid !== true) {
                    error = valid
                    pending.unshift(question)
                    continue
                }

                error = undefined
            }

            newAnswers[name!] = result[name!]
            finished.push(question)
        }

        if (pendingItemsCount > 0) {
            console.log()
        }

        return {
            answers: newAnswers,
            askedSomething: pendingItemsCount > 0
        }
    }

    export async function prompt<T extends string = string>(questions: PromptObject<T> | PromptObject<T>[], options: PromptOptions = defaultOptions) {
        questions = Array.isArray(questions) ? questions : [questions]

        if (questions.length == 0) {
            throw new Error('At least one question is required.')
        }

        let newAnswers: any = options.answers

        while (true) {
            const result = await promptInternal<T>(questions, { ...options, answers: newAnswers })
            newAnswers = result.answers

            if (!options.useConfirmation) {
                break
            }

            if (options.clearBeforeConfirmations) {
                console.clear()
            }

            if (options.reprintBeforeConfirmations) {
                await PromptHelper.reprintAnswers(questions, newAnswers)
            }

            const editResult = await prompts([
                {
                    name: 'edit',
                    type: 'toggle',
                    message: 'Do you want to edit something?',
                    active: 'yes',
                    inactive: 'no',
                    initial: false,
                }
            ])

            if (!editResult.edit) {
                break
            }

            const fieldsResult = await prompts([
                {
                    type: 'multiselect',
                    name: 'fields',
                    message: 'Select the fields to edit:',
                    choices: questions.map(question => {
                        const message = PromptHelper.getValue(question.message, question, newAnswers)
                        return {
                            title: message as string
                        }
                    })
                }
            ])

            for (const index of fieldsResult.fields) {
                const question = questions[index]
                const name = PromptHelper.getValue(question.name, question, newAnswers)
                delete newAnswers[name]
            }
        }

        if (options.useConfirmation) {
            console.log()
        }

        return newAnswers
    }

    export async function waitForKey(message?: string) {
        console.log(message ?? 'Press any key to continue...');
        await waitForKeypress();

    }

    export async function getDefaultValues<T extends string = string>(questions: PromptObject<T> | PromptObject<T>[], answers?: any): Promise<prompts.Answers<T>> {
        return PromptHelper.getDefaultValues(questions, answers)
    }

    function waitForKeypress() {
        return new Promise<void>(resolve => {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.once('data', () => {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                resolve();
            });
        });
    }
}