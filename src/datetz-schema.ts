import { DateTz, IDateTz } from "@lbd-sh/date-tz";
import mongoose, { SchemaType } from "mongoose";


export class DateTzSchema extends SchemaType {
  constructor(key: string, options: any) {
    super(key, options, 'DateTzSchema');
  }

  cast(data: any): IDateTz {
    if (data instanceof DateTz) {
      return data;
    }
    if (data && typeof data === 'object' && typeof data.timestamp === 'number' && typeof data.timezone === 'string') {
      return new DateTz(data.timestamp, data.timezone);
    }
    // if (typeof data === 'string') {
    //   return DateTz.parse(data, DateTz.defaultFormat);
    // }
    return undefined;
  }
}

mongoose.Schema.Types['DateTzSchema'] = DateTzSchema;