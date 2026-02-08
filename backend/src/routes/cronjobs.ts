import { Router, Request, Response } from 'express';
import fs from 'fs';

const router = Router();

interface Cronjob {
  id: string;
  name: string;
  description?: string;
  schedule: string;
  nextRun?: number;
  lastRun?: number;
  status: 'ok' | 'error' | 'idle' | 'disabled';
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
    };
  }>;
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
          status: (job.state?.lastStatus as Cronjob['status']) || 'idle',
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
