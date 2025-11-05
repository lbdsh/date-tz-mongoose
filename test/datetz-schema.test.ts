import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { DateTz } from '@lbd-sh/date-tz';
import { DateTzSchema } from '../src/datetz-schema';

const createSchema = () => new DateTzSchema('executedAt', {});

describe('DateTzSchema.cast', () => {
  it('serialises existing DateTz instances into plain objects', () => {
    const schema = createSchema();
    const existing = new DateTz({ timestamp: Date.now(), timezone: 'Europe/Rome' });

    const result = schema.cast(existing);

    expect(result).toEqual({
      timestamp: existing.valueOf(),
      timezone: existing.timezone,
    });
  });

  it('creates a DateTz instance from a plain object before serialising it', () => {
    const schema = createSchema();
    const timestamp = 1_701_234_567_890;
    const timezone = 'UTC';

    const result = schema.cast({ timestamp, timezone });
    const expected = new DateTz(timestamp, timezone);

    expect(result).toEqual({
      timestamp: expected.valueOf(),
      timezone: expected.timezone,
    });
  });

  it('infers UTC when the timezone is omitted', () => {
    const schema = createSchema();
    const timestamp = 123_456;
    const result = schema.cast({ timestamp });

    expect(result).toEqual({
      timestamp: new DateTz(timestamp, 'UTC').valueOf(),
      timezone: 'UTC',
    });
  });

  it('returns undefined when timestamp is missing', () => {
    const schema = createSchema();

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
    const expected = new DateTz(1_701_234_567_890, 'Europe/Rome');

    expect(casted).toEqual({
      timestamp: expected.valueOf(),
      timezone: expected.timezone,
    });
  });

  it('hydrates document values as DateTz while persisting plain objects', () => {
    const Schema = new mongoose.Schema({ startsAt: { type: DateTzSchema } });
    const Model = mongoose.model(`DateTzSchemaTest_${Date.now()}`, Schema);

    const timestamp = 1_701_234_567_890;
    const timezone = 'Europe/Rome';
    const doc = new Model({ startsAt: { timestamp, timezone } });
    const expected = new DateTz(timestamp, timezone);

    expect(doc.startsAt).toBeInstanceOf(DateTz);
    expect(doc.startsAt.timezone).toBe(timezone);
    expect(doc.startsAt.valueOf()).toBe(expected.valueOf());

    expect(doc.toObject().startsAt).toEqual({
      timestamp: expected.valueOf(),
      timezone: expected.timezone,
    });

    const hydrated = Model.hydrate({ _id: doc._id, startsAt: { timestamp, timezone } });
    expect(hydrated.startsAt).toBeInstanceOf(DateTz);
    expect(hydrated.toObject().startsAt).toEqual({
      timestamp: expected.valueOf(),
      timezone: expected.timezone,
    });
  });
});
