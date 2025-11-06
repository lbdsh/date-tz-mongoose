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

type TestDocument = {
  scenario?: string;
  startsAt?: DateTz | Date | number | string | null | undefined;
};

const TEST_COLLECTION = 'date_tz_schema_tests';
const testSchema = new mongoose.Schema<TestDocument>({
  scenario: { type: String },
  startsAt: { type: DateTzSchema },
});

const getModel = () =>
  (mongoose.models.DateTzSchemaTest as mongoose.Model<TestDocument> | undefined) ??
  mongoose.model<TestDocument>('DateTzSchemaTest', testSchema, TEST_COLLECTION);

const findRawDocument = async (
  id: mongoose.Types.ObjectId,
): Promise<{ startsAt?: unknown } | null> => {
  return mongoose.connection.db.collection(TEST_COLLECTION).findOne<{ startsAt?: unknown }>({ _id: id });
};

describe('DateTzSchema persistence', () => {
  it('parses a formatted pickupDate string when timezone is provided separately', async () => {
    const Model = getModel();
    const pickupDateString = '2025-11-01 22:35:00.00';
    const timezone = 'Europe/London';

    const parsed = DateTz.parse(pickupDateString, DateTz.defaultFormat, timezone);
    const doc = await Model.create({ scenario: 'parse formatted pickup date', startsAt: parsed });

    expect(parsed).toBeInstanceOf(DateTz);
    expect(parsed.timezone).toBe(timezone);
    expect(parsed.valueOf()).toBe(1_762_036_500_000);

    const raw = await findRawDocument(doc._id);
    expect(raw?.startsAt).toEqual({
      timestamp: parsed.valueOf(),
      timezone,
    });
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
    const doc = new Model({ startsAt: { timestamp, timezone } });
    const expected = new DateTz(timestamp, timezone);

    expect(doc.startsAt).toEqual({
      timestamp: expected.valueOf(),
      timezone: expected.timezone,
    });

    // toObject senza opzioni getters: true restituisce la forma persistibile plain
    const plain = doc.toObject();
    expect(plain.startsAt).toEqual({
      timestamp: expected.valueOf(),
      timezone: expected.timezone,
    });

    const persisted = await Model.hydrate({ _id: new mongoose.Types.ObjectId(), startsAt: { timestamp, timezone } });
    expect(persisted.startsAt).toEqual({
      timestamp: expected.valueOf(),
      timezone: expected.timezone,
    });

    const hydrated = Model.hydrate({ _id: doc._id, startsAt: { timestamp, timezone } });
    expect(hydrated.startsAt).toEqual({
      timestamp: expected.valueOf(),
      timezone: expected.timezone,
    });
    const hydratedPlain = hydrated.toObject();
    expect(hydratedPlain.startsAt).toEqual({
      timestamp: expected.valueOf(),
      timezone: expected.timezone,
    });
  });
});
