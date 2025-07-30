export interface FileInjector {
    shouldInject(srcPath: string, targetPath: string, variables: any): boolean | Promise<boolean>
    inject(srcPath: string, targetPath: string, variables: any): void | Promise<void>
    getInjection(content: string, variables: any): string | Promise<string | Buffer>
}