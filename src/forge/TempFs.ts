import fs from 'fs-extra';
import { dirname, join, resolve } from "path";
import { GlobHelper } from '../common/GlobHelper';
import { PathHelper } from "../common/PathHelper";
import { IFileInjector } from "../Injectors/LiquidInjector";
import { FileExistsAction, TempPathType, WriteOptions } from "../types";
import Database from 'better-sqlite3';

export interface TempPath {
    targetPath: string
    type?: TempPathType
    tempPath?: string
    ifFileExists?: FileExistsAction
    approved?: boolean
}

export class TempFs {
    private db: Database.Database | undefined = undefined
    private dbPath: string

    constructor(private tempDir: string, private injector: IFileInjector) {
        this.dbPath = join(this.tempDir, 'index.db')
    }

    private getConnection() {
        if (this.db)
            return this.db

        this.db = new Database(this.dbPath)

        this.db.exec(`
            CREATE TABLE IF NOT EXISTS temp_index (
                target_path TEXT NOT NULL,
                type TEXT NOT NULL,
                temp_path TEXT,
                if_file_exists TEXT,
                approved INTEGER,
                PRIMARY KEY (target_path, type)
            );

            CREATE INDEX IF NOT EXISTS idx_temp_index_target_path ON temp_index(target_path);

            CREATE INDEX IF NOT EXISTS idx_temp_index_type ON temp_index(type);
            `)

        return this.db
    }

    getTempPath(path: string, type: TempPathType) {
        path = resolve(path)

        const db = this.getConnection()

        const prep = db.prepare<any, TempPath>(`
            SELECT 
                target_path targetPath,
                temp_path tempPath,
                if_file_exists ifFileExists,
                approved approved
            FROM temp_index
            WHERE 1=1
                AND target_path = @target
                AND type = @type`)

        return prep.get({
            target: path,
            type: type
        })
    }

    * getTempPaths(filters?: Partial<TempPath>, sort: boolean = false) {
        filters ??= {}

        if (filters?.targetPath) {
            filters.targetPath = resolve(filters.targetPath)
        }

        const clauses = []

        const con = this.getConnection()

        if (filters.targetPath) {
            clauses.push('target_path = @target')
        }

        if (filters.type) {
            clauses.push('type = @type')
        }

        if (filters.approved) {
            clauses.push('approved = @approved')
        }

        const orderBy = sort ?
            'ORDER BY LENGTH(target_path) ASC, target_path ASC' :
            ''

        let offset = 0
        const pageSize = 100

        while (true) {
            const prep = con.prepare<any, TempPath>(`
                SELECT 
                    target_path targetPath,
                    temp_path tempPath,
                    if_file_exists ifFileExists,
                    approved approved
                FROM temp_index
                WHERE ${clauses.join('\n AND ')}
                ${orderBy}
                LIMIT @limit OFFSET @offset
                `)

            const rows = prep.all({
                'target': filters?.targetPath,
                'type': filters?.type,
                'approved': filters?.approved ? 1 : 0,
                'limit': pageSize,
                'offset': offset,
            })

            if (rows.length == 0) {
                return
            }

            offset += pageSize

            for (const row of rows) {
                yield row
            }
        }
    }

    approve(path: string) {
        const con = this.getConnection()
        const prep = con.prepare(
            `UPDATE temp_index SET approved = 1 WHERE target_path = @path`
        )

        prep.run({
            'path': path
        })
    }

    private async setTempFile(tempFile: TempPath) {
        tempFile.targetPath = resolve(tempFile.targetPath)
        tempFile.tempPath = resolve(tempFile.tempPath!)
        tempFile.type = 'file'

        const current = this.getTempPath(tempFile.targetPath, 'file')
        if (current) {
            await fs.rm(current.tempPath!)
        }

        const con = this.getConnection()
        const prep = con.prepare(`
            INSERT OR REPLACE INTO temp_index
                (target_path, type, temp_path, if_file_exists)
            VALUES
                (@target, @type, @temp, @file_exists)
            `
        )

        prep.run({
            'target': tempFile.targetPath,
            'type': tempFile.type,
            'temp': tempFile.tempPath,
            'file_exists': tempFile.ifFileExists
        })
    }

    private setTempDir(tempDir: TempPath) {
        tempDir.targetPath = resolve(tempDir.targetPath)
        tempDir.type = 'directory'

        const con = this.getConnection()
        const prep = con.prepare(`
            INSERT OR REPLACE INTO temp_index
                (target_path, type, approved)
            VALUES
                (@target, @type, @approved)
            `)

        prep.run({
            'target': tempDir.targetPath,
            'type': tempDir.type,
            'approved': tempDir.approved ? 1 : 0
        })
    }

    private async newTempPath() {
        while (true) {
            const tempPath = join(this.tempDir, crypto.randomUUID() + '.temp')
            if (await fs.exists(tempPath)) {
                continue
            }

            return tempPath
        }
    }

    ensureDirectory(path: string) {
        const temp: TempPath = {
            targetPath: path,
            approved: true
        }

        this.setTempDir(temp)
    }

    async writeFile(path: string,
        data: string | NodeJS.ArrayBufferView,
        options?: WriteOptions,
    ) {
        this.ensureDirectory(dirname(path))

        const temp: TempPath = {
            tempPath: await this.newTempPath(),
            targetPath: path,
            ifFileExists: options?.ifFileExists
        }

        await fs.writeFile(temp.tempPath!, data)
        await this.setTempFile(temp)
    }

    async copyFile(src: string, dest: string, options: WriteOptions = {}) {
        const stat = await fs.stat(src)
        if (stat.isDirectory()) {
            throw new Error('src is a directory')
        }

        this.ensureDirectory(dirname(dest))

        const temp: TempPath = {
            tempPath: await this.newTempPath(),
            targetPath: dest,
            ifFileExists: options?.ifFileExists
        }

        await fs.copy(src, temp.tempPath!)
        await this.setTempFile(temp)
    }

    async injectFile(src: string, dest: string, variables: any, options: WriteOptions = {}) {
        const stat = await fs.stat(src)
        if (stat.isDirectory()) {
            throw new Error('src is a directory')
        }

        const newPath = PathHelper.injectPath(dest, variables)
        const newDir = dirname(newPath)
        this.ensureDirectory(newDir)

        const temp: TempPath = {
            tempPath: await this.newTempPath(),
            targetPath: newPath,
            ifFileExists: options?.ifFileExists
        }

        await this.setTempFile(temp)

        if (await this.injector.shouldInject(src, temp.tempPath!, variables)) {
            try {
                await this.injector.inject(src, temp.tempPath!, variables)
                return
            } catch (error) {
                throw new Error(`Error injecting '${src}'`, { cause: error })
            }
        }

        await fs.copyFile(src, temp.tempPath!)
    }

    exists(path: string) {
        const iterator = this.getTempPaths({
            targetPath: path
        })
        const result = iterator.next()

        return !result.done
    }

    async readFile(path: string) {
        const tempPath = this.getTempPath(path, 'file')
        if (!tempPath) {
            return undefined
        }

        const tempFilePath = join(this.tempDir, tempPath.tempPath!)
        return await fs.readFile(tempFilePath)
    }

    createReadStream(path: string, options?: BufferEncoding) {
        const tempPath = this.getTempPath(path, 'file')
        if (!tempPath) {
            throw new Error(`File '${path}' does not exist in the temp directory.`)
        }

        const tempFilePath = join(this.tempDir, tempPath.tempPath!)
        return fs.createReadStream(tempFilePath, options)
    }

    async rollback() {
        if (this.db) {
            this.db.close()
        }

        await this.clearFiles()
    }

    async commit() {
        const con = this.getConnection()

        const directories = this.getTempPaths(
            {
                type: 'directory'
            },
            true)

        for await (const dir of directories) {
            await fs.ensureDir(dir.targetPath)
        }

        const files = this.getTempPaths(
            {
                type: 'file',
                approved: true
            },
            true)

        for await (const file of files) {
            await fs.copy(file.tempPath!, file.targetPath)
            await fs.rm(file.tempPath!)
        }

        con.close()
        await this.clearFiles()
    }

    private async clearFiles() {
        const tempFiles = GlobHelper.globAll(
            '**/*.temp',
            {
                cwd: this.tempDir,
                nodir: true,
                absolute: true
            })

        for await (const file of tempFiles) {
            await fs.rm(file)
        }

        if (await fs.exists(this.dbPath)) {
            await fs.rm(this.dbPath)
        }
    }
}