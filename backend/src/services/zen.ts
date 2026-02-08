import { config } from '../config.js';
import { logger } from '../logger.js';
import { loadAllMessages } from './messages.js';

const ZEN_API_BASE = 'https://opencode.ai/zen/v1';

export interface ZenUsage {
  requestsToday: number;
  requestsThisMonth: number;
  totalRequests: number;
  models: ZenModelUsage[];
}

export interface ZenModelUsage {
  modelId: string;
  requests: number;
  percentage: number;
  isFree: boolean;
}

export interface ZenModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface LocalZenUsage extends ZenUsage {
  lastUpdated: string;
}

export class ZenService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.zen.apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${ZEN_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error({ url, status: response.status, error }, 'Zen API error');
      throw new Error(`Zen API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async getLocalUsage(): Promise<LocalZenUsage> {
    try {
      // Load all messages from OpenCode storage
      const messages = await loadAllMessages();

      // Count by model
      const modelCounts = new Map<string, number>();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      let requestsToday = 0;
      let requestsThisMonth = 0;

      for (const msg of messages) {
        if (msg.model?.modelID) {
          const count = modelCounts.get(msg.model.modelID) || 0;
          modelCounts.set(msg.model.modelID, count + 1);

          // Check time range
          if (msg.time?.created) {
            if (msg.time.created >= today) {
              requestsToday++;
            }
            if (msg.time.created >= thisMonth) {
              requestsThisMonth++;
            }
          }
        }
      }

      const totalRequests = messages.length;
      const models: ZenModelUsage[] = [];

      // Free models list
      const freeModels = new Set([
        'minimax-m2.1-free',
        'kimi-k2.5-free',
        'glm-4.7-free',
        'gpt-5-nano',
        'big-pickle',
        'trinity-large-preview-free',
      ]);

      for (const [modelId, count] of modelCounts) {
        models.push({
          modelId,
          requests: count,
          percentage: totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0,
          isFree: freeModels.has(modelId),
        });
      }

      // Sort by usage count descending
      models.sort((a, b) => b.requests - a.requests);

      return {
        requestsToday,
        requestsThisMonth,
        totalRequests,
        models,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get local Zen usage');
      throw error;
    }
  }

  async getModels(): Promise<ZenModel[]> {
    try {
      const response = await this.request<{ data: ZenModel[] }>('/models');
      return response.data;
    } catch (error) {
      logger.error({ error }, 'Failed to get Zen models');
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const zenService = new ZenService();
