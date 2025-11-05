import { DateTz, IDateTz } from "@lbd-sh/date-tz";
import mongoose, { SchemaType } from "mongoose";

type SerializableDateTz = Pick<IDateTz, "timestamp" | "timezone">;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isSerializableDateTz = (value: unknown): value is SerializableDateTz => {
  if (!isRecord(value)) {
    return false;
  }
  const { timestamp, timezone } = value;
  const hasTimestamp = typeof timestamp === "number" && Number.isFinite(timestamp);
  const hasTimezone = timezone === undefined || typeof timezone === "string";
  return hasTimestamp && hasTimezone;
};

const toDateTz = (value: unknown): DateTz | undefined => {
  if (value instanceof DateTz) {
    return value;
  }
  if (isSerializableDateTz(value)) {
    try {
      return new DateTz(value.timestamp, value.timezone);
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const toSerializable = (value: DateTz): SerializableDateTz => ({
  timestamp: value.valueOf(),
  timezone: value.timezone,
});

export class DateTzSchema extends SchemaType {
  constructor(key: string, options: any) {
    super(key, options, "DateTzSchema");

    this.get((value: unknown) => toDateTz(value) ?? value);
  }

  cast(
    data: any,
    _doc?: mongoose.Document,
    init?: boolean
  ): SerializableDateTz | DateTz | undefined {
    const normalized = toDateTz(data);
    if (!normalized) {
      return undefined;
    }

    return init ? normalized : toSerializable(normalized);
  }
}

mongoose.Schema.Types["DateTzSchema"] = DateTzSchema;
