import { Awaitable, ColorResolvable } from 'discord.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { path } from 'reciple';

export interface BaseConfig {
    [key: string]: any;
    defaultEmbedColor: ColorResolvable;
    errorEmbedColor: ColorResolvable;
}

export const defaultSnowflake: string = '0000000000000000000';

export const defaultConfig = {
    guildId: defaultSnowflake,
    defaultEmbedColor: 'Blue',
    errorEmbedColor: 'Grey'
} satisfies BaseConfig;

export type Config = typeof defaultConfig & BaseConfig;

export interface CreateConfigOptions<T = string> {
    stringifyData?: (data: T) => string;
}

export function createConfig<T = string>(filePath: string, content: T, options?: CreateConfigOptions<T> & { formatData: (data: string, defaultContent: T) => T }): T;
export function createConfig<T = string>(filePath: string, content: T, options?: CreateConfigOptions<T> & { formatData?: (data: string, defaultContent: T) => T }): T|string {
    if (!existsSync(filePath)) {
        mkdirSync(path.dirname(filePath), { recursive: true });
        writeFileSync(filePath, typeof options?.stringifyData === 'function'
            ? options.stringifyData(content)
            : typeof content === 'object'
                ? JSON.stringify(content)
                : String(content)
        );

        return content;
    }

    const readContents = readFileSync(filePath, 'utf-8');

    return typeof options?.formatData === 'function' ? options.formatData(readContents, content) : readContents;
}