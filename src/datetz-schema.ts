import { DateTz, IDateTz } from "@lbd-sh/date-tz";
import mongoose, { SchemaType } from "mongoose";

type DateTzInput =
  | IDateTz
  | DateTz
  | Date
  | number
  | string
  | null
  | undefined
  | { timestamp: number; timezone?: string };

type DateTzSchemaOptions = {
  format?: string;
  timezone?: string;
  [key: string]: unknown;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isDateTzLike = (value: unknown): value is { timestamp: number; timezone?: string } => {
  return isPlainObject(value) && typeof value.timestamp === "number" && (typeof value.timezone === "string" || value.timezone === undefined);
};

export class DateTzSchema extends SchemaType {
  private readonly defaultTimezone?: string;
  private readonly parseFormat?: string;

  constructor(key: string, options?: DateTzSchemaOptions) {
    const { format, timezone, ...schemaOptions } = options ?? {};
    super(key, schemaOptions, "DateTzSchema");
    this.defaultTimezone = timezone;
    this.parseFormat = format;
  }

  cast(data: DateTzInput): IDateTz | null | undefined {
    if (data === undefined) {
      return undefined;
    }
    if (data === null) {
      return null;
    }

    const coerced = this.coerceToDateTz(data);
    if (coerced) {
      return coerced;
    }

    return undefined;
  }

  castForQuery($condition: unknown, val?: unknown): unknown {
    if (arguments.length === 2) {
      if (Array.isArray(val)) {
        return val.map((entry) => this.cast(entry as DateTzInput));
      }
      return this.cast(val as DateTzInput);
    }

    return this.cast($condition as DateTzInput);
  }

  checkRequired(value: unknown): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    if (value instanceof DateTz) {
      return true;
    }

    if (isDateTzLike(value)) {
      return true;
    }

    return false;
  }

  private coerceToDateTz(value: Exclude<DateTzInput, null | undefined>): IDateTz | undefined {
    if (value instanceof DateTz) {
      return value;
    }

    if (value instanceof Date) {
      return new DateTz(value.getTime(), this.resolveTimezone());
    }

    if (typeof value === "number") {
      return new DateTz(value, this.resolveTimezone());
    }

    if (typeof value === "string") {
      const format = this.parseFormat ?? DateTz.defaultFormat;
      try {
        return DateTz.parse(value, format, this.resolveTimezone());
      } catch {
        return undefined;
      }
    }

    if (isDateTzLike(value)) {
      const timezone = this.resolveTimezone(value.timezone);
      return new DateTz({ timestamp: value.timestamp, timezone });
    }

    return undefined;
  }

  private resolveTimezone(candidate?: string): string {
    if (candidate && typeof candidate === "string") {
      return candidate;
    }
    if (this.defaultTimezone) {
      return this.defaultTimezone;
    }
    return "UTC";
  }
}

const schemaTypes = mongoose.Schema.Types as Record<string, unknown>;
schemaTypes["DateTzSchema"] = DateTzSchema;
schemaTypes["DateTz"] = DateTzSchema;
