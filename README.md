# @lbd-sh/date-tz-mongoose

Custom Mongoose schema type for working with [`@lbd-sh/date-tz`](https://github.com/lbdsh/date-tz), a lightweight timezone-aware date library.  
This package makes it easy to persist `DateTz` instances in MongoDB while keeping timezone metadata intact.

## Features
- 🔄 **Seamless casting** of plain objects or existing `DateTz` instances.
- 🧭 **Timezone preservation** thanks to the `timestamp` + `timezone` pair stored alongside each value.
- 🧪 **Vitest-powered tests** to guarantee casting reliability and proper Mongoose integration.

## Installation

```bash
npm install @lbd-sh/date-tz-mongoose
```

Peer dependencies:

- `mongoose` (automatically pulled as dev dependency for local development)
- `@lbd-sh/date-tz`

## Usage

```ts
import mongoose from 'mongoose';
import { DateTz } from '@lbd-sh/date-tz';
import { DateTzSchema } from '@lbd-sh/date-tz-mongoose';

const EventSchema = new mongoose.Schema({
  startsAt: { type: DateTzSchema, required: true },
  endsAt: { type: DateTzSchema },
});

const Event = mongoose.model('Event', EventSchema);

await Event.create({
  startsAt: new DateTz(Date.now(), 'Europe/Rome'),
  endsAt: { timestamp: Date.now(), timezone: 'UTC' }, // plain object works too
});
```

### Casting rules

`DateTzSchema.cast` accepts the following inputs:

- Existing `DateTz` instances (returned as-is).
- Plain objects that contain a numeric `timestamp` and a string `timezone`. They are converted into new `DateTz` values.

All other inputs fall back to `undefined`, letting Mongoose trigger its standard validation errors.

## Development

Clone the repository, install dependencies, and run the available scripts:

```bash
npm install
npm run build   # Compiles TypeScript to dist/
npm test        # Runs the Vitest suite
```

## Contributing

Issues and pull requests are welcome at  
<https://github.com/lbdsh/date-tz-mongoose>.

## License

Licensed under the MIT License.

---

Created with ❤️ by [Transfeero](https://www.transfeero.com) and friends.  
Offered by **LBD Srl** · [www.lbdsh.com](https://www.lbdsh.com)
