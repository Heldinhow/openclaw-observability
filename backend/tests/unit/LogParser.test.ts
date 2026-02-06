import { LogParser } from '../../src/services/LogParser';

describe('LogParser', () => {
  describe('parseLine', () => {
    it('should parse a valid JSON log line', () => {
      const line = '{"timestamp":"2026-02-06T14:30:00.123Z","level":"info","subsystem":"gateway","message":"Test message"}';
      const result = LogParser.parseLine(line);
      
      expect(result).not.toBeNull();
      expect(result!.timestamp).toBe('2026-02-06T14:30:00.123Z');
      expect(result!.level).toBe('info');
      expect(result!.subsystem).toBe('gateway');
      expect(result!.message).toBe('Test message');
    });

    it('should return null for empty lines', () => {
      expect(LogParser.parseLine('')).toBeNull();
      expect(LogParser.parseLine('   ')).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      expect(LogParser.parseLine('not valid json')).toBeNull();
      expect(LogParser.parseLine('{invalid}')).toBeNull();
    });

    it('should return null for lines missing required fields', () => {
      expect(LogParser.parseLine('{"timestamp":"2026-02-06T14:30:00.123Z"}')).toBeNull();
      expect(LogParser.parseLine('{"level":"info"}')).toBeNull();
    });

    it('should include sourceFile if provided', () => {
      const line = '{"timestamp":"2026-02-06T14:30:00.123Z","level":"info","subsystem":"test","message":"msg"}';
      const result = LogParser.parseLine(line, '/path/to/file.log');
      
      expect(result).not.toBeNull();
      expect(result!.sourceFile).toBe('/path/to/file.log');
    });
  });

  describe('parseLines', () => {
    it('should parse multiple valid lines', () => {
      const lines = [
        '{"timestamp":"2026-02-06T14:30:00.123Z","level":"info","subsystem":"test","message":"msg1"}',
        '{"timestamp":"2026-02-06T14:30:01.123Z","level":"warn","subsystem":"test","message":"msg2"}',
        'invalid line',
        '{"timestamp":"2026-02-06T14:30:02.123Z","level":"error","subsystem":"test","message":"msg3"}'
      ];
      
      const result = LogParser.parseLines(lines);
      
      expect(result).toHaveLength(3);
      expect(result[0].message).toBe('msg1');
      expect(result[1].message).toBe('msg2');
      expect(result[2].message).toBe('msg3');
    });

    it('should return empty array for no valid entries', () => {
      const result = LogParser.parseLines(['invalid', 'also invalid']);
      expect(result).toHaveLength(0);
    });
  });

  describe('validateFormat', () => {
    it('should validate correct JSON Lines format', () => {
      const content = `
        {"timestamp":"2026-02-06T14:30:00.123Z","level":"info","subsystem":"test","message":"msg1"}
        {"timestamp":"2026-02-06T14:30:01.123Z","level":"warn","subsystem":"test","message":"msg2"}
      `.trim();

      const result = LogParser.validateFormat(content);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.lineCount).toBe(2);
      expect(result.validEntries).toBe(2);
    });

    it('should detect missing fields', () => {
      const content = '{"timestamp":"2026-02-06T14:30:00.123Z","level":"info"}';
      
      const result = LogParser.validateFormat(content);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('formatEntry', () => {
    it('should format entry for display', () => {
      const entry = {
        id: 'test-id',
        timestamp: '2026-02-06T14:30:00.123Z',
        level: 'info' as const,
        subsystem: 'gateway',
        message: 'Test message',
        parsedAt: '2026-02-06T14:30:00.500Z'
      };
      
      const result = LogParser.formatEntry(entry);
      
      expect(result).toContain('INFO');
      expect(result).toContain('gateway');
      expect(result).toContain('Test message');
    });
  });
});
