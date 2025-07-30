import { ForgeEventAction, ForgeStages } from "@/forges/Types";
import { Forge } from "./Forge";

export class EventEmitter {
    private listeners: Record<string, ForgeEventAction<any>[]> = {}

    async emit(name: ForgeStages, forge: Forge) {
        if (!this.listeners[name])
            return

        for (const listener of this.listeners[name]) {
            await listener({
                id: forge.id,
                taskId: forge.taskId,
                stageHistory: forge.stageHistory,
                currentStage: forge.currentStage,

                config: forge.config,
                fs: forge.fs,
                memFs: forge.memFs,
                paths: forge.paths,
                program: forge.program,
                prompts: forge.prompts,
                variables: forge.variables,
            })
        }
    }

    addListener(name: ForgeStages, action: ForgeEventAction<any>) {
        this.listeners[name] ??= []
        this.listeners[name].push(action)

        return () => {
            const index = this.listeners[name].indexOf(action)
            this.listeners[name].splice(index, 1)
        }
    }
}