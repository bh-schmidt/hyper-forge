export class ForgeError extends Error {
    title: string
    description?: string
    constructor(title: string, description?: string) {
        if (description) {
            super(title + '\n' + description)
        }
        else {
            super(title)
        }

        this.title = title
        this.description = description
    }
}
