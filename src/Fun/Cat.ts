import { RecipleClient, SlashCommandBuilder } from 'reciple';
import BaseModule from '../BaseModule.js';
import { AttachmentBuilder } from 'discord.js';

export interface APICatResponse {
    tags: string[];
    createdAt: string;
    updatedAt: string;
    validated: boolean;
    owner: string|null;
    file: string;
    mimetype: string;
    size: number;
    _id: string;
    url: string;
}

export interface CatOptions {
    type?: 'small'|'medium'|'square'|'original';
    filter?: 'blur'|'mono'|'sepia'|'negative'|'paint'|'pixel';
    width?: number;
    height?: number;
}

export interface CatNormalOptions extends CatOptions {
    random: true;
}

export interface CatTagOptions extends CatOptions {
    tag: string;
}

export interface CatGifOptions extends CatOptions {
    gif: true;
}

export interface CatSaysOptions extends CatOptions {
    says: string;
    size?: number;
    color?: string;
}

export class Cat extends BaseModule {
    public endpoints = Cat.endpoints;

    public async onStart(client: RecipleClient<boolean>): Promise<boolean> {
        this.commands = [
            new SlashCommandBuilder()
                .setName('cat')
                .setDMPermission(true)
                .setDescription('Send random cat pic :3')
                .addStringOption(message => message
                    .setName('message')
                    .setDescription('Cat says...')
                )
                .setExecute(async ({ interaction }) => {
                    await interaction.deferReply();

                    const says = interaction.options.getString('message') || undefined;
                    const attachment = await this.getCat({ says, random: true }, true);

                    await interaction.editReply({ files: [attachment] });
                })
        ];

        return true;
    }

    public async getCat(options: CatNormalOptions & Partial<CatSaysOptions>|CatGifOptions & Partial<CatSaysOptions>|CatTagOptions & Partial<CatSaysOptions>|CatSaysOptions, attachment?: false): Promise<APICatResponse>;
    public async getCat(options: CatNormalOptions & Partial<CatSaysOptions>|CatGifOptions & Partial<CatSaysOptions>|CatTagOptions & Partial<CatSaysOptions>|CatSaysOptions, attachment?: true): Promise<AttachmentBuilder>;
    public async getCat(options: CatNormalOptions & Partial<CatSaysOptions>|CatGifOptions & Partial<CatSaysOptions>|CatTagOptions & Partial<CatSaysOptions>|CatSaysOptions, attachment?: boolean): Promise<APICatResponse|AttachmentBuilder> {
        let url: string = 'https://cataas.com';
        let queries: Record<string, string> = {};

        if (options.type) queries.type = options.type;
        if (options.filter) queries.filter = options.filter;
        if (options.width) queries.width = options.width.toString();
        if (options.height) queries.height = options.height.toString();

        if (this._isCatSaysOptions(options)) {
            if (options.size) queries.size = options.size.toString();
            if (options.color) queries.color = options.color;
        }

        if (this._isCatGifOptions(options)) {
            if (this._isCatSaysOptions(options)) {
                url += this.endpoints['/cat/gif/says/:says'](options.says);
            } else {
                url += this.endpoints['/cat/gif']();
            }
        } else if (this._isCatTagOptions(options)) {
            if (this._isCatSaysOptions(options)) {
                url += this.endpoints['/cat/:tag/says/:says'](options.tag, options.says);
            } else {
                url += this.endpoints['/cat/:tag'](options.tag);
            }
        } else {
            if (this._isCatSaysOptions(options)) {
                url += this.endpoints['/cat/says/:says'](options.says);
            } else {
                url += this.endpoints['/cat']();
            }
        }

        if (!attachment) queries.json = 'true';

        url += Object.keys(queries).map((q, i) => `${i ? '&' : '?'}${q}=${encodeURIComponent(queries[q])}`).join();

        if (attachment) {
            return new AttachmentBuilder(Buffer.from(await (await fetch(url)).arrayBuffer()));
        } else {
            return (await fetch(url)).json();
        }
    }

    public async tags(): Promise<string[]> {
        return (await fetch('https://cataas.com/api/tags')).json();
    }

    private _isCatSaysOptions(options: any): options is CatSaysOptions {
        return options?.says !== undefined;
    }

    private _isCatGifOptions(options: any): options is CatGifOptions & Partial<CatSaysOptions> {
        return options?.gif === true;
    }

    private _isCatTagOptions(options: any): options is CatTagOptions & Partial<CatSaysOptions> {
        return options?.tag !== undefined;
    }

    public static endpoints = {
        '/cat': (): '/cat' => '/cat',
        '/cat/says/:says': (says: string): `/cat/says/${string}` => `/cat/says/${says}`,
        '/cat/:tag': (tag: string): `/cat${string}` => `/cat${tag}`,
        '/cat/:tag/says/:says': (tag: string, says: string): `/cat/${string}/says/${string}` => `/cat/${tag}/says/${says}`,
        '/cat/gif': (): '/cat/gif' => '/cat/gif',
        '/cat/gif/says/:says': (says: string): `/cat/gif/says/${string}` => `/cat/gif/says/${says}`
    };
}

export default new Cat();