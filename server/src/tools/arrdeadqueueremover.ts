import axios from "axios";
import { addSetting, getSetting } from "../settings"
import { addTask } from "../tasks";
import type { MediaQueueItem } from "../types/arr";

var removedStalled: string[] = [];

function minutesSince(dateStr: string): number {
    const added = new Date(dateStr).getTime();
    return (Date.now() - added) / 1000 / 60;
}

async function processQueue(app: {
    url: string;
    apiKey: string;
}, name: string) {
    // console.log(`[${name}] Checking  ...`);
    const client = axios.create({
        baseURL: `${app.url}/api/v3`,
        headers: {
            "X-Api-Key": app.apiKey,
        },
    });

    const { data } = await client.get("/queue?pageSize=2000");

    // console.log(`[${name}] Found ${data.records.length} in queue`);
    for (const item of data.records as MediaQueueItem[]) {
        const stalled = (item.status == "unknown" || (item.status == "warning" && item.sizeleft > 0) || item.status == "queued" || item.status == "paused") && minutesSince(item.added) >= (await getSetting<number>("arrdeadqueueremover.time.stalled") || 30);

        if (stalled && !removedStalled.includes(item.title)) {
            removedStalled.push(item.title);

            // console.log(`[${name}] Removing stalled: ${item.title} added ${minutesSince(item.added)} minutes ago`);

            await client.delete(`/queue/${item.id}`, {
                params: {
                    blocklist: true,
                },
            });
        }
    }
}

export async function runArrDeadQueueRemover() {
    if (await getSetting<boolean>("arrdeadqueueremover.sonarr.enabled")) {
        await processQueue({
            url: (await getSetting("arrdeadqueueremover.sonarr.url"))!,
            apiKey: (await getSetting("arrdeadqueueremover.sonarr.apikey"))!
        }, "Sonarr");
    }
    if (await getSetting<boolean>("arrdeadqueueremover.radarr.enabled")) {
        await processQueue({
            url: (await getSetting("arrdeadqueueremover.radarr.url"))!,
            apiKey: (await getSetting("arrdeadqueueremover.radarr.apikey"))!
        }, "Radarr");
    }
    removedStalled = [];
}

export async function initArrDeadQueueRemover() {
    await addSetting("arrdeadqueueremover.time.stalled", "30");

    await addSetting("arrdeadqueueremover.sonarr.enabled", "false");
    await addSetting("arrdeadqueueremover.sonarr.url", "http://exemple.sonarr:8989");
    await addSetting("arrdeadqueueremover.sonarr.apikey", "");

    await addSetting("arrdeadqueueremover.radarr.enabled", "false");
    await addSetting("arrdeadqueueremover.radarr.url", "http://exemple.radarr:8989");
    await addSetting("arrdeadqueueremover.radarr.apikey", "");

    await addTask("arrdeadqueueremover", "*/5 * * * *");
}