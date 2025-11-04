import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { DateTz } from '@lbd-sh/date-tz';
import { DateTzSchema } from '../src/datetz-schema';

const createSchema = () => new DateTzSchema('executedAt', {});

describe('DateTzSchema.cast', () => {
  it('returns an existing DateTz instance unchanged', () => {
    const schema = createSchema();
    const existing = new DateTz({ timestamp: Date.now(), timezone: 'Europe/Rome' });

    const result = schema.cast(existing);

    expect(result).toBe(existing);
  });

  it('creates a DateTz instance from a plain object', () => {
    const schema = createSchema();
    const timestamp = 1_701_234_567_890;
    const timezone = 'UTC';

    const result = schema.cast({ timestamp, timezone });
    const expected = new DateTz(timestamp, timezone);

    expect(result).toBeInstanceOf(DateTz);
    expect(result?.timezone).toBe(expected.timezone);
    expect(result?.valueOf()).toBe(expected.valueOf());
  });

  it('returns undefined for objects missing required fields', () => {
    const schema = createSchema();

    expect(schema.cast({ timestamp: 123 })).toBeUndefined();
    expect(schema.cast({ timezone: 'UTC' })).toBeUndefined();
  });

  it('returns undefined for unsupported input types', () => {
    const schema = createSchema();

    expect(schema.cast('2024-04-24T00:00:00Z')).toBeUndefined();
    expect(schema.cast(123)).toBeUndefined();
    expect(schema.cast(null)).toBeUndefined();
    expect(schema.cast(undefined)).toBeUndefined();
  });
});

describe('Mongoose integration', () => {
  it('registers the schema type with mongoose', () => {
    expect(mongoose.Schema.Types.DateTzSchema).toBe(DateTzSchema);

    const schemaType = new mongoose.Schema.Types.DateTzSchema('executedAt', {});
    const casted = schemaType.cast({ timestamp: 1_701_234_567_890, timezone: 'Europe/Rome' });

    expect(casted).toBeInstanceOf(DateTz);
  });
});
