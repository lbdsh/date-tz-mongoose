import { DateTz } from '@lbd-sh/date-tz';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DateTzSchema } from '../src/datetz-schema';

const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/date_tz_mongoose_test';

beforeAll(async () => {
  await mongoose.connect(mongoUri, { dbName: 'date_tz_mongoose_test' });
});



afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

type TestDocument = { startsAt?: DateTz | Date | number | string | null | undefined };

const TEST_COLLECTION = 'date_tz_schema_tests';
const testSchema = new mongoose.Schema<TestDocument>({ startsAt: { type: DateTzSchema } });

const getModel = () =>
  (mongoose.models.DateTzSchemaTest as mongoose.Model<TestDocument> | undefined) ??
  mongoose.model<TestDocument>('DateTzSchemaTest', testSchema, TEST_COLLECTION);

const findRawDocument = async (
  id: mongoose.Types.ObjectId,
): Promise<{ startsAt?: unknown } | null> => {
  return mongoose.connection.db.collection(TEST_COLLECTION).findOne<{ startsAt?: unknown }>({ _id: id });
};

describe('DateTzSchema persistence', () => {
  it('serialises existing DateTz instances into plain objects', async () => {
    const Model = getModel();
    const timestamp = 1_701_234_560_000;
    const existing = new DateTz({ timestamp, timezone: 'Europe/Rome' });

    const doc = await Model.create({ startsAt: existing });
    expect(doc.startsAt).toBeInstanceOf(DateTz);
    expect(doc.startsAt.timezone).toBe(existing.timezone);

    const raw = await findRawDocument(doc._id);
    expect(raw?.startsAt).toEqual({
      timestamp: doc.startsAt.valueOf(),
      timezone: existing.timezone,
    });
  });

  it('creates a DateTz instance from a plain object before serialising it', async () => {
    const Model = getModel();
    const timestamp = 1_701_234_567_890;
    const timezone = 'UTC';

    const doc = await Model.create({ startsAt: { timestamp, timezone } });
    const expected = new DateTz(timestamp, timezone);
    expect(doc.startsAt).toBeInstanceOf(DateTz);
    expect(doc.startsAt.valueOf()).toBe(expected.valueOf());
    expect(doc.startsAt.timezone).toBe(expected.timezone);

    const raw = await findRawDocument(doc._id);
    expect(raw?.startsAt).toEqual({
      timestamp: expected.valueOf(),
      timezone: expected.timezone,
    });
  });

  it('infers UTC when the timezone is omitted', async () => {
    const Model = getModel();
    const timestamp = 123_456;

    const doc = await Model.create({ startsAt: { timestamp } });
    expect(doc.startsAt).toBeInstanceOf(DateTz);
    expect(doc.startsAt.timezone).toBe('UTC');
    expect(doc.startsAt.valueOf()).toBe(new DateTz(timestamp, 'UTC').valueOf());

    const raw = await findRawDocument(doc._id);
    expect(raw?.startsAt).toEqual({
      timestamp: new DateTz(timestamp, 'UTC').valueOf(),
      timezone: 'UTC',
    });
  });

  it('accepts native Date instances and numeric timestamps', async () => {
    const Model = getModel();
    const timestamp = 1_701_234_000_000;

    const fromDate = await Model.create({ startsAt: new Date(timestamp) });
    expect(fromDate.startsAt).toBeInstanceOf(DateTz);
    expect(fromDate.startsAt.timezone).toBe('UTC');
    expect(fromDate.startsAt.valueOf()).toBe(timestamp);

    const rawFromDate = await findRawDocument(fromDate._id);
    expect(rawFromDate?.startsAt).toEqual({
      timestamp,
      timezone: 'UTC',
    });

    const fromNumber = await Model.create({ startsAt: timestamp });
    expect(fromNumber.startsAt).toBeInstanceOf(DateTz);
    expect(fromNumber.startsAt.timezone).toBe('UTC');
    expect(fromNumber.startsAt.valueOf()).toBe(timestamp);

    const rawFromNumber = await findRawDocument(fromNumber._id);
    expect(rawFromNumber?.startsAt).toEqual({
      timestamp,
      timezone: 'UTC',
    });
  });

  it('returns undefined when timestamp is missing', async () => {
    const Model = getModel();

    const doc = await Model.create({ startsAt: { timezone: 'UTC' } });
    expect(doc.startsAt).toBeUndefined();

    const raw = await findRawDocument(doc._id);
    expect(raw?.startsAt).toBeUndefined();
  });

  it('returns undefined for unsupported input types', async () => {
    const Model = getModel();

    const stringDoc = await Model.create({ startsAt: '2024-04-24T00:00:00Z' });
    expect(stringDoc.startsAt).toBeUndefined();
    const rawString = await findRawDocument(stringDoc._id);
    expect(rawString?.startsAt).toBeUndefined();

    const nullDoc = await Model.create({ startsAt: null });
    expect(nullDoc.startsAt).toBeUndefined();
    const rawNull = await findRawDocument(nullDoc._id);
    expect(rawNull?.startsAt).toBeUndefined();

    const undefinedDoc = await Model.create({ startsAt: undefined });
    expect(undefinedDoc.startsAt).toBeUndefined();
    const rawUndefined = await findRawDocument(undefinedDoc._id);
    expect(rawUndefined?.startsAt).toBeUndefined();
  });

  it('parses a formatted pickupDate string when timezone is provided separately', async () => {
    const Model = getModel();
    const timestamp = 1_701_234_567_890;
    const timezone = 'Europe/Rome';

    const doc = await Model.create({ startsAt: { timestamp, timezone } });
    const pickupDateString = doc.startsAt?.toString(DateTz.defaultFormat);

    expect(typeof pickupDateString).toBe('string');

    const model = { pickupDate: pickupDateString! };
    const airportPickup = { timezone };

    const parsed = DateTz.parse("2025-04-24T00:00:00Z", DateTz.defaultFormat, airportPickup.timezone);

    expect(parsed).toBeInstanceOf(DateTz);
    expect(parsed.timezone).toBe(timezone);
    expect(parsed.valueOf()).toBe(doc.startsAt?.valueOf());
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

  it('hydrates document values as DateTz while persisting plain objects', async () => {
    const Schema = new mongoose.Schema({ startsAt: { type: DateTzSchema } });
    const ModelName = `DateTzSchemaTest_${Date.now()}`;
    const Model = mongoose.model(ModelName, Schema);

    const timestamp = 1_701_234_567_890;
    const timezone = 'Europe/Rome';
    const doc = await Model.create({ startsAt: { timestamp, timezone } });
    const expected = new DateTz(timestamp, timezone);

    expect(doc.startsAt).toBeInstanceOf(DateTz);
    expect(doc.startsAt.timezone).toBe(timezone);
    expect(doc.startsAt.valueOf()).toBe(expected.valueOf());

    const plain = doc.toObject();
    expect(plain.startsAt).toBeInstanceOf(DateTz);
    expect(plain.startsAt.valueOf()).toBe(expected.valueOf());
    expect(plain.startsAt.timezone).toBe(expected.timezone);

    const reloaded = await Model.findById(doc._id);
    expect(reloaded).not.toBeNull();
    expect(reloaded?.startsAt).toBeInstanceOf(DateTz);
    expect(reloaded?.startsAt.valueOf()).toBe(expected.valueOf());
    expect(reloaded?.startsAt.timezone).toBe(expected.timezone);

    const hydrated = Model.hydrate({ _id: doc._id, startsAt: { timestamp, timezone } });
    expect(hydrated.startsAt).toBeInstanceOf(DateTz);
    const hydratedPlain = hydrated.toObject();
    expect(hydratedPlain.startsAt).toBeInstanceOf(DateTz);
    expect(hydratedPlain.startsAt.valueOf()).toBe(expected.valueOf());
    expect(hydratedPlain.startsAt.timezone).toBe(expected.timezone);
  });
});
