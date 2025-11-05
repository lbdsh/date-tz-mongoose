import { DateTz, IDateTz } from '@lbd-sh/date-tz';
import mongoose, { SchemaType } from 'mongoose';

const DEFAULT_TIMEZONE = 'UTC';

type SerializableDateTz = { timestamp: number; timezone: string };

const isTimestamp = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const toDateTz = (value: unknown): DateTz | undefined => {
  if (value instanceof DateTz) {
    return value;
  }

  if (value && typeof value === 'object') {
    const maybe = value as Partial<IDateTz>;
    if (!isTimestamp(maybe.timestamp)) {
      return undefined;
    }

    const timezone =
      typeof maybe.timezone === 'string' && maybe.timezone.length > 0
        ? maybe.timezone
        : DEFAULT_TIMEZONE;

    return new DateTz(maybe.timestamp, timezone);
  }

  return undefined;
};

const toSerializable = (value: unknown): SerializableDateTz | undefined => {
  const dateTz = toDateTz(value);
  if (!dateTz) {
    return undefined;
  }

  return {
    timestamp: dateTz.valueOf(),
    timezone: dateTz.timezone || DEFAULT_TIMEZONE,
  };
};

export class DateTzSchema extends SchemaType {
  constructor(key: string, options: any) {
    super(key, options, 'DateTzSchema');

    this.get((value: unknown) => {
      const dateTz = toDateTz(value);
      return dateTz ?? value;
    });

    this.set((value: unknown) => toSerializable(value));
  }

  cast(value: unknown): IDateTz | undefined {
    return toSerializable(value);
  }
}

mongoose.Schema.Types['DateTzSchema'] = DateTzSchema;
