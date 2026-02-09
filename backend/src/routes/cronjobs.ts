import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

interface Cronjob {
  id: string;
  name: string;
  description?: string;
  schedule: string;
  nextRun?: number;
  lastRun?: number;
  lastStatus?: 'ok' | 'error' | 'idle';
  lastDurationMs?: number;
  enabled: boolean;
}

interface QueueTask {
  task: string;
  status: 'ready' | 'in-progress' | 'blocked' | 'done';
}

interface CronjobsFile {
  version: number;
  jobs: Array<{
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    schedule: {
      kind: 'cron' | 'every' | 'at';
      expr?: string;
      everyMs?: number;
      tz?: string;
    };
    state?: {
      nextRunAtMs?: number;
      lastRunAtMs?: number;
      lastStatus?: 'ok' | 'error' | 'idle';
      lastDurationMs?: number;
    };
  }>;
}

interface CronRun {
  id: string;
  jobId: string;
  timestamp: number;
  status: 'ok' | 'error';
  summary?: string;
  error?: string;
  durationMs: number;
  nextRunAtMs?: number;
}

interface CronHistoryResponse {
  jobId: string;
  jobName: string;
  runs: CronRun[];
  totalRuns: number;
}

const CRON_RUNS_PATH = '/root/.openclaw/cron/runs';

function parseRunLine(line: string): CronRun | null {
  try {
    const data = JSON.parse(line);
    return {
      id: `${data.jobId}-${data.runAtMs}`,
      jobId: data.jobId,
      timestamp: data.ts || data.runAtMs,
      status: data.status === 'ok' ? 'ok' : 'error',
      summary: data.summary,
      error: data.error,
      durationMs: data.durationMs || 0,
      nextRunAtMs: data.nextRunAtMs,
    };
  } catch {
    return null;
  }
}

async function readCronRunsFile(jobId: string): Promise<CronRun[]> {
  const runs: CronRun[] = [];
  const filePath = path.join(CRON_RUNS_PATH, `${jobId}.jsonl`);

  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    for (const line of lines) {
      const run = parseRunLine(line);
      if (run) {
        runs.push(run);
      }
    }

    return runs.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error reading cron runs file:', error);
    return [];
  }
}

async function readAllCronRuns(): Promise<Map<string, CronRun[]>> {
  const runsMap = new Map<string, CronRun[]>();

  if (!fs.existsSync(CRON_RUNS_PATH)) {
    return runsMap;
  }

  try {
    const files = fs.readdirSync(CRON_RUNS_PATH).filter(f => f.endsWith('.jsonl'));

    for (const file of files) {
      const jobId = file.replace('.jsonl', '');
      const runs = await readCronRunsFile(jobId);
      if (runs.length > 0) {
        runsMap.set(jobId, runs);
      }
    }

    return runsMap;
  } catch (error) {
    console.error('Error reading all cron runs:', error);
    return runsMap;
  }
}

async function getJobName(jobId: string): Promise<string> {
  const cronjobsPath = '/root/.openclaw/cron/jobs.json';

  if (!fs.existsSync(cronjobsPath)) {
    return jobId;
  }

  try {
    const content = fs.readFileSync(cronjobsPath, 'utf-8');
    const data: CronjobsFile = JSON.parse(content);
    const job = data.jobs.find(j => j.id === jobId);
    return job?.name || jobId;
  } catch {
    return jobId;
  }
}

// Get cronjobs from OpenClaw
router.get('/', async (_req: Request, res: Response) => {
  try {
    const cronjobsPath = '/root/.openclaw/cron/jobs.json';
    const cronjobs: Cronjob[] = [];

    if (fs.existsSync(cronjobsPath)) {
      const content = fs.readFileSync(cronjobsPath, 'utf-8');
      const data: CronjobsFile = JSON.parse(content);

      for (const job of data.jobs) {
        const scheduleStr = job.schedule.kind === 'cron'
          ? job.schedule.expr
          : job.schedule.kind === 'every'
            ? `every ${job.schedule.everyMs ? Math.round(job.schedule.everyMs / 60000) : 0}min`
            : 'once';

        cronjobs.push({
          id: job.id,
          name: job.name,
          description: job.description,
          schedule: scheduleStr || 'unknown',
          nextRun: job.state?.nextRunAtMs,
          lastRun: job.state?.lastRunAtMs,
          lastStatus: job.state?.lastStatus,
          lastDurationMs: job.state?.lastDurationMs,
          enabled: job.enabled
        });
      }
    }

    res.json({ cronjobs });
  } catch (error) {
    console.error('Error fetching cronjobs:', error);
    res.status(500).json({ error: 'Failed to fetch cronjobs' });
  }
});

// Get cronjob history by job ID
router.get('/:jobId/history', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const runs = await readCronRunsFile(jobId);
    const limitedRuns = runs.slice(0, limit);
    const jobName = await getJobName(jobId);

    const response: CronHistoryResponse = {
      jobId,
      jobName,
      runs: limitedRuns,
      totalRuns: runs.length,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching cronjob history:', error);
    res.status(500).json({ error: 'Failed to fetch cronjob history' });
  }
});

// Get all cronjobs history
router.get('/history/all', async (_req: Request, res: Response) => {
  try {
    const limit = 50;
    const runsMap = await readAllCronRuns();
    const jobsPath = '/root/.openclaw/cron/jobs.json';

    let jobNames: Map<string, string> = new Map();
    if (fs.existsSync(jobsPath)) {
      try {
        const content = fs.readFileSync(jobsPath, 'utf-8');
        const data: CronjobsFile = JSON.parse(content);
        for (const job of data.jobs) {
          jobNames.set(job.id, job.name);
        }
      } catch {}
    }

    const allHistory = Array.from(runsMap.entries()).map(([jobId, runs]) => ({
      jobId,
      jobName: jobNames.get(jobId) || jobId,
      runs: runs.slice(0, limit),
      totalRuns: runs.length,
    }));

    res.json({ jobs: allHistory });
  } catch (error) {
    console.error('Error fetching all cron history:', error);
    res.status(500).json({ error: 'Failed to fetch cron history' });
  }
});

// Get queue from Agent Autonomy Kit
router.get('/queue', async (_req: Request, res: Response) => {
  try {
    const queuePath = '/root/.openclaw/workspace/tasks/QUEUE.md';

    const queue = {
      ready: [] as QueueTask[],
      inProgress: [] as QueueTask[],
      blocked: [] as QueueTask[],
      done: [] as QueueTask[]
    };

    if (fs.existsSync(queuePath)) {
      const content = fs.readFileSync(queuePath, 'utf-8');

      const sections = content.split('## ');
      for (const section of sections) {
        const lines = section.split('\n');
        const sectionName = lines[0].trim().toLowerCase().replace(' ', '-');

        for (const line of lines) {
          const taskMatch = line.match(/^- \[ \] (.+)/);

          if (taskMatch) {
            const task: QueueTask = {
              task: taskMatch[1].trim(),
              status: sectionName === 'done' ? 'done' :
                      sectionName === 'in-progress' ? 'in-progress' :
                      sectionName === 'blocked' ? 'blocked' : 'ready'
            };

            if (queue[sectionName as keyof typeof queue]) {
              queue[sectionName as keyof typeof queue].push(task);
            }
          }
        }
      }
    }

    res.json({ queue });
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// Refresh cronjobs/queue data
router.post('/refresh', async (_req: Request, res: Response) => {
  try {
    res.json({ status: 'ok', message: 'Data refreshed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh' });
  }
});

export { router };
