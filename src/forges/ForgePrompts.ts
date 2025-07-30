import { VariablesTypes } from "@/forges/VariableMapper";
import { PromptHelper } from "@/internals/PromptHelper";
import prompts from "prompts";
import { Prompts } from "../utils/Prompts";
import { Forge } from "./Forge";

export interface ForgePromptsOptions {
    clearBetweenQuestions?: boolean
    reprintBetweenQuestions?: boolean
    clearBeforeConfirmations?: boolean
    reprintBeforeConfirmations?: boolean
    maxReprintCount?: number,
    answers?: any
    confirmAnswers?: boolean
    registerQuestions?: boolean
    clearAfterStage?: boolean
    reprintAfterStage?: boolean
}

export class ForgePrompts<TVariables extends VariablesTypes> {
    questions: Prompts.PromptObject<any>[]

    _options: ForgePromptsOptions = {
        clearBeforeConfirmations: true,
        clearBetweenQuestions: true,
        maxReprintCount: 10,
        reprintBeforeConfirmations: true,
        reprintBetweenQuestions: true,
        confirmAnswers: true,
        registerQuestions: true,
        clearAfterStage: true,
        reprintAfterStage: true
    }

    constructor(private forge: Forge) {
        this.questions = []
    }

    async prompt<T extends Extract<keyof TVariables, string> = Extract<keyof TVariables, string>>(questions: Prompts.PromptObject<T> | Prompts.PromptObject<T>[], options?: ForgePromptsOptions): Promise<prompts.Answers<T>> {
        questions = Array.isArray(questions) ? questions : [questions]
        options = {
            ...this._options,
            ...options
        }

        let answers = {
            ...await this.forge.variables.getValues(),
            ...options.answers
        }

        const skipPrompts = await this.forge.variables.get('SKIP_PROMPTS')
        if (skipPrompts?.length && skipPrompts.length > 0) {
            questions = questions.filter(question => {
                const name = PromptHelper.getValue<T, typeof question.name>(question.name, question, answers)!
                return !skipPrompts.includes(name)
            })
        }

        if (questions.length == 0) {
            return answers
        }

        this.addDefaultValidation<T>(questions, answers);

        if (options.registerQuestions) {
            this.questions.push(...questions)
        }

        if (await this.forge.variables.get('DISABLE_PROMPTS')) {
            answers = await Prompts.getDefaultValues(questions, answers)
        }
        else {
            const disableConfirmation = await this.forge.variables.get('DISABLE_PROMPT_CONFIRMATION')

            answers = await Prompts.prompt(questions, {
                ...options,
                answers: answers,
                stdin: this.forge.stdin,
                stdout: this.forge.stdout,
                useConfirmation: !disableConfirmation && options.confirmAnswers
            })
        }

        await this.forge.variables.setValues(answers)

        return answers
    }

    async reprintAnswers<T extends string = string>(questions: Prompts.PromptObject<T>[] = this.questions, answers?: any) {
        answers ??= await this.forge.variables.getValues()
        await PromptHelper.reprintAnswers(questions, answers)
    }

    private addDefaultValidation<T extends Extract<keyof TVariables, string> = Extract<keyof TVariables, string>>(questions: Prompts.PromptObject<T>[], answers: any) {
        const mapper = this.forge.variables.mapper;
        for (const question of questions) {
            if (question.validate) {
                continue;
            }

            const name = PromptHelper.getValue<T, typeof question.name>(question.name, question, answers) as any;
            if (!mapper.isMapped(name)) {
                continue;
            }

            question.validate = (value) => {
                return mapper.validate(name, value);
            };
        }
    }
}