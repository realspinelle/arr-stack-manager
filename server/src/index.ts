import { startScheduler } from "./tasks.ts";
import { startWebserver } from "./webserver.ts";
import { initQbitMirror } from "./tools/qbitmirror.ts";
import { initSettings } from "./settings.ts";
import { initArrDeadQueueRemover } from "./tools/arrdeadqueueremover.ts";
import { initQbitIpBlockList } from "./tools/qbitipblocklist.ts";
import { prisma } from "./prisma.ts";

async function checkDatabase(): Promise<boolean> {
    try {
        await prisma.$connect();
        await prisma.$disconnect();
        return true;
    } catch {
        return false;
    }
}

async function main() {
    if (!await checkDatabase()) return console.log("DB not working ...");
    
    await initArrDeadQueueRemover();
    await initQbitIpBlockList();
    await initQbitMirror();
    await initSettings(); // needs to be last init


    await startScheduler();
    await startWebserver(); // should be last start
}

main();