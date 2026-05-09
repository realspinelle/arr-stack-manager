import { addSetting, getSetting } from "../settings"
import { addTask } from "../tasks";
import { promisify } from "util";
import { gunzip } from "zlib";
import fs from "fs/promises"
import path from "path";
import axios from "axios";

export async function runQbitIpBlockList() {
    if (!(await getSetting<boolean>("qbitipblocklist.enabled"))) return;
    const gunzipAsync = promisify(gunzip);
    const list = await axios.get((await getSetting("qbitipblocklist.link"))!, {
        headers: {
            'User-Agent': 'curl/8.7.1'
        },
        responseType: 'arraybuffer'
    });

    const decompressed = await gunzipAsync(Buffer.from(list.data));
    const text = decompressed.toString('utf-8');
    await fs.writeFile(path.join(await getSetting("qbitipblocklist.path") + "blocklist.p2p"), text)
}

export async function initQbitIpBlockList() {
    await addSetting("qbitipblocklist.enabled", "false");
    await addSetting("qbitipblocklist.link", "");
    await addSetting("qbitipblocklist.path", "");

    await addTask("qbitipblocklist", "*/5 * * * *");
}