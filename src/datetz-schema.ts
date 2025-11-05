import { DateTz, IDateTz } from '@lbd-sh/date-tz';
import mongoose, { SchemaType } from 'mongoose';

const DEFAULT_TIMEZONE = 'UTC';

const isTimestamp = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const coerceToDateTz = (value: unknown): DateTz | undefined => {
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

const cloneDateTz = (value: DateTz): DateTz =>
  new DateTz(value.valueOf(), value.timezone || DEFAULT_TIMEZONE);

export class DateTzSchema extends SchemaType {
  constructor(key: string, options: any) {
    super(key, options, 'DateTzSchema');

    this.get((value: unknown) => coerceToDateTz(value) ?? value);
    this.transform((value: unknown) => {
      const dateTz = coerceToDateTz(value);
      return dateTz ? cloneDateTz(dateTz) : value;
    });
  }

  cast(value: unknown): DateTz | undefined {
    return coerceToDateTz(value);
  }
}

mongoose.Schema.Types['DateTzSchema'] = DateTzSchema;
