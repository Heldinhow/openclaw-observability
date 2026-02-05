import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { Message, MessageMetadata, MessagePart } from '../types/index.js';

async function readMessageMetadata(filePath: string): Promise<MessageMetadata | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const metadata = JSON.parse(content) as MessageMetadata;

    if (!metadata.id || !metadata.sessionID) {
      logger.warn({ filePath }, 'Invalid message file: missing required fields');
      return null;
    }

    return metadata;
  } catch (error) {
    logger.warn({ error, filePath }, 'Failed to read message file');
    return null;
  }
}

async function readMessageParts(messageId: string): Promise<MessagePart[]> {
  try {
    const partsDir = path.join(config.storage.path, 'part', messageId);

    const dirExists = await fs.access(partsDir).then(() => true).catch(() => false);
    if (!dirExists) {
      return [];
    }

    const files = await fs.readdir(partsDir);
    const parts: MessagePart[] = [];

    for (const file of files) {
      if (!file.startsWith('prt_') || !file.endsWith('.json')) {
        continue;
      }

      const filePath = path.join(partsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const part = JSON.parse(content) as MessagePart;
      parts.push(part);
    }

    return parts;
  } catch (error) {
    logger.warn({ error, messageId }, 'Failed to read message parts');
    return [];
  }
}

export async function loadSessionMessages(sessionId: string): Promise<Message[]> {
  try {
    const messageDir = path.join(config.storage.path, 'message', sessionId);

    const dirExists = await fs.access(messageDir).then(() => true).catch(() => false);
    if (!dirExists) {
      logger.warn({ sessionId }, 'Message directory not found');
      return [];
    }

    const files = await fs.readdir(messageDir);
    const messages: Message[] = [];

    for (const file of files) {
      if (!file.startsWith('msg_') || !file.endsWith('.json')) {
        continue;
      }

      const filePath = path.join(messageDir, file);
      const metadata = await readMessageMetadata(filePath);

      if (!metadata) {
        continue;
      }

      const parts = await readMessageParts(metadata.id);

      messages.push({
        ...metadata,
        parts,
      });
    }

    messages.sort((a, b) => a.time.created - b.time.created);

    logger.info({ sessionId, messageCount: messages.length }, 'Session messages loaded');

    return messages;
  } catch (error) {
    logger.error({ error, sessionId }, 'Failed to load session messages');
    throw error;
  }
}
