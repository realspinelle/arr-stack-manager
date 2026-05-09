import cron, { type ScheduledTask } from 'node-cron';
import type { Tasks } from '../generated/prisma/client';
import { prisma } from './prisma';
import { runQbitMirror } from './tools/qbitmirror';
import { runQbitIpBlockList } from './tools/qbitipblocklist';
import { runArrDeadQueueRemover } from './tools/arrdeadqueueremover';

const runningTasks = new Map<number, ScheduledTask>();
const jobSchedules = new Map<number, string>();

function getTaskHandler(job: Tasks): () => void {
    return async () => {
        try {
            switch (job.name) {
                case 'qbitmirror':
                    await runQbitMirror();
                    break;
                case 'qbitipblocklist':
                    await runQbitIpBlockList();
                    break;
                case 'arrdeadqueueremover':
                    await runArrDeadQueueRemover();
                    break;
                default:
                    console.warn(`No handler for job: ${job.name}`);
            }
        } catch (err) {
            console.error(`Error while running task : ${job.name}\n${err}`);
        }
    };
}

function stopJob(id: number) {
    const task = runningTasks.get(id);
    if (task) {
        task.stop();
        runningTasks.delete(id);
        jobSchedules.delete(id);
        console.log(`Stopped job ${id}`);
    }
}

function startJob(job: Tasks) {
    if (!cron.validate(job.cron)) {
        console.error(`Invalid cron for job "${job.name}": ${job.cron}`);
        return;
    }

    const task = cron.schedule(job.cron, getTaskHandler(job));
    runningTasks.set(job.id, task);
    jobSchedules.set(job.id, job.cron);
    console.log(`Started job "${job.name}" → ${job.cron}`);
}

export async function syncJobs() {
    try {
        const jobs = await prisma.tasks.findMany();
        const dbIds = new Set(jobs.map((j) => j.id));
        for (const [id] of runningTasks) {
            if (!dbIds.has(id)) stopJob(id);
        }

        for (const job of jobs) {
            const isRunning = runningTasks.has(job.id);
            const scheduleChanged = jobSchedules.get(job.id) !== job.cron;

            if (!job.enabled) {
                if (isRunning) stopJob(job.id);
                continue;
            }

            if (isRunning && scheduleChanged) {
                stopJob(job.id);
                startJob(job);
            } else if (!isRunning) {
                startJob(job);
            }
        }
    } catch (err) {
        console.error('Failed to sync jobs:', err);
    }
}

export async function addTask(name: string, defaultCron: string = "*/5 * * * *") {
    if (!await prisma.tasks.findUnique({ where: { name } })) {
        await prisma.tasks.create({
            data: {
                name: name,
                cron: defaultCron
            }
        });
    }
}

export async function startScheduler() {
    console.log('Starting scheduler...');
    await syncJobs();
    setInterval(syncJobs, 60 * 1000);
}
