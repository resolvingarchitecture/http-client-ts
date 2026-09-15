# http-client (TypeScript)

A plain (non-anonymized) HTTP/HTTPS client for **1M5**: `Envelope` in,
`Envelope` out — method, URL, and headers come from the envelope, the
response body is written back onto it.

A TypeScript port of [`http-client-java`](https://github.com/resolvingarchitecture/http-client-java)'s
`ra.http.HTTPService`, outbound (`sendOut`) side only — see `DESIGN.md`.

## Use

```ts
import { Action, Envelope } from "@resolvingarchitecture/ra-common";
import { HttpClient } from "@resolvingarchitecture/http-client";

const client = HttpClient.fromConfig({});
const env = Envelope.document();
env.url = "https://resolvingarchitecture.io";
env.action = Action.Get;
if (await client.send(env)) {
  const body = Buffer.from(env.content() as Uint8Array).toString();
}
```

### Config keys

| key | default | meaning |
|-----|---------|---------|
| `ra.http.client.trustAllCerts` | `false` | skip TLS certificate verification (test-only) |
| `ra.http.client.proxyUrl` | unset | HTTP/HTTPS/SOCKS proxy URL, e.g. `http://127.0.0.1:9050` |
| `ra.http.client.requestTimeoutSecs` | `60` | per-request timeout |

## Build

```
npm install
npm test
npm run build
npm run typecheck
```

## Status

Client only — GET/POST/PUT/DELETE, HTTP and HTTPS (via `undici`), multipart
form uploads, a proxy dispatcher. No local HTTP server / SPA / WebSocket
hosting (the Jetty-based half of `http-client-java`) — see `DESIGN.md` and
`TODO.md`.
