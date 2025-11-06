import { DateTz } from "@lbd-sh/date-tz";
import mongoose, { SchemaType } from "mongoose";

// Custom SchemaType per gestire DateTz salvando sia timestamp che timezone.
// Strategia:
//  - In fase di salvataggio (set/cast) una istanza DateTz viene trasformata
//    in plain object { timestamp, timezone } così MongoDB memorizza entrambe le info.
//  - In fase di lettura (getter) un plain object viene riconvertito in DateTz.
//  - Le stringhe opzionalmente possono essere parse (decommentare se serve).
export class DateTzSchema extends SchemaType {
  constructor(key: string, options: any) {
    super(key, options, 'DateTzSchema');
  }

  // Cast viene chiamato quando si assegna un valore al path o nelle query.
  // Ritorniamo SEMPRE la forma che vogliamo persistere (plain object) oppure
  // lanciamo un CastError per valori non validi.
  cast(data: any): { timestamp: number; timezone: string } | undefined {
    // Istanza DateTz -> oggetto persistibile (canonicalizziamo timestamp via valueOf())
    if (data instanceof DateTz) {
      return { timestamp: data.valueOf(), timezone: data.timezone };
    }
    // Oggetto già conforme -> creiamo DateTz per ottenere timestamp canonico (es. arrotondamenti interni)
    if (data && typeof data === 'object' && typeof data.timestamp === 'number' && typeof data.timezone === 'string') {
      const dt = new DateTz(data.timestamp, data.timezone);
      return { timestamp: dt.valueOf(), timezone: dt.timezone };
    }
    // Parsing da stringa (se desideri abilitarlo decommenta)
    // if (typeof data === 'string') {
    //   try {
    //     const dt = DateTz.parse(data, DateTz.defaultFormat);
    //     return { timestamp: dt.timestamp, timezone: dt.timezone };
    //   } catch (err) {
    //     throw new mongoose.Error.CastError('DateTzSchema', data, (this as any).path, err);
    //   }
    // }
    // Valore vuoto -> permettiamo undefined se il campo non è required
    if (data === null || data === undefined || data === '') return undefined;
    throw new mongoose.Error.CastError('DateTzSchema', data, (this as any).path);
  }
}

// Getter applicato ai valori letti dai documenti (solo accesso, non influenza persistenza)
// Nota: Mongoose non applica sempre getters in toObject() senza opzioni, quindi
// questo serve soprattutto per accesso diretto (doc.startsAt) e hydrate.
DateTzSchema.prototype.get = function (value: any) {
  if (value && typeof value === 'object' && typeof value.timestamp === 'number' && typeof value.timezone === 'string') {
    try {
      return new DateTz(value.timestamp, value.timezone);
    } catch {
      return value; // fallback silenzioso
    }
  }
  return value;
};

(mongoose.Schema.Types as any)['DateTzSchema'] = DateTzSchema;
