import { RecipleClient } from 'reciple';
import BaseModule from '../BaseModule.js';
import { Collection } from 'discord.js';

export class Utility extends BaseModule {
    public client!: RecipleClient;

    public async onStart(client: RecipleClient<boolean>): Promise<boolean> {
        this.client = client;

        return true;
    }

    public async resolveFromCachedManager<V>(id: string, manager: { cache: Collection<string, V>; fetch(key: string): Promise<V|null> }): Promise<V> {
        const data = manager.cache.get(id) ?? await manager.fetch(id);
        if (data === null) throw new Error(`Couldn't fetch (${id}) from manager`);
        return data;
    }
}

export default new Utility();