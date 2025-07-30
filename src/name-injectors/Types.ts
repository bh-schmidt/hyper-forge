export interface NameInjector {
    /**
     * Injects the collected/setted variables into the path returning the new target path.
     * 
     * @param srcPath Path of the source file or `undefined` if it is a directory
     * @param targetPath Target path of the file/directory
     * @param variables Collected/setted variables
     * @returns The target path with the variables injected
     */
    inject(srcPath: string | undefined, targetPath: string, variables: any): string | Promise<string>
}