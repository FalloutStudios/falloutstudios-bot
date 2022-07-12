import { RecipleClient, RecipleScript } from 'reciple';

export class Util implements RecipleScript {
    public versions: string = '2.x.x';

    public onStart(client: RecipleClient<boolean>): boolean | Promise<boolean> {
        return true;
    }
}

export default new Util();