import { GetForgeRunnerArgs, getForgeRunner as getForgeRunnerUseCase } from "../use-cases/runner/getForgeRunner/getForgeRunner";

export namespace RunnerProvider {
    export async function getForgeRunner(args: GetForgeRunnerArgs) {
        return await getForgeRunnerUseCase(args)
    }
}