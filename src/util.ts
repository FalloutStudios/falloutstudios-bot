import { RecipleClient, RecipleScript } from 'reciple';

export class Util implements RecipleScript {
    public versions: string = '^3.0.0';

    public onStart(client: RecipleClient<boolean>): boolean | Promise<boolean> {
        return true;
    }
}

export default new Util();