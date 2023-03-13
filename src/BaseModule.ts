import { AnyCommandBuilder, AnyCommandData, RecipleClient, RecipleModuleScript, RecipleModuleScriptUnloadData } from 'reciple';
import { AnyInteractionListener } from './Events/_InteractionEventTypes.js';

export default abstract class BaseModule implements RecipleModuleScript {
    public versions: string = '^7';
    public commands: (AnyCommandBuilder|AnyCommandData)[] = [];
    public interactionEvents: AnyInteractionListener[] = [];

    public abstract onStart(client: RecipleClient): Promise<boolean>;

    public async onLoad(client: RecipleClient): Promise<void> {}
    public async onUnload(data: RecipleModuleScriptUnloadData): Promise<void> {}
}