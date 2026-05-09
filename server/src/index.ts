import { startScheduler } from "./tasks.ts";
import { startApi } from "./api.ts";
import { initQbitMirror } from "./tools/qbitmirror.ts";
import { initSettings } from "./settings.ts";
import { initArrDeadQueueRemover } from "./tools/arrdeadqueueremover.ts";
import { initQbitIpBlockList } from "./tools/qbitipblocklist.ts";


await initArrDeadQueueRemover();
await initQbitIpBlockList();
await initQbitMirror();
await initSettings(); // needs to be last init


await startScheduler();
await startApi(); // should be last start