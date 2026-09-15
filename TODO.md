# TODO

- [ ] Local HTTP server / SPA / WebSocket hosting (the Jetty half of
      `http-client-java`), if a TypeScript consumer ever needs to host
      inbound endpoints (e.g. a future onion service).
- [ ] `NetworkConnectionReport`-equivalent type in `ra-common-ts`, if
      `1m5-core-ts`'s router ends up wanting structured blocked-response
      data rather than a logged warning + error message.
- [ ] Streamed request/response bodies (large file upload/download) —
      currently buffers the whole response into memory
      (`response.arrayBuffer()`).
- [ ] `1m5-core-ts` doesn't exist yet — no `HttpProtocolService` wiring
      possible until it does (see `1m5-core-java`'s
      `network.onemfive.core.protocol.HttpProtocolService` /
      `1m5-core-rust`'s `protocol.rs` for the pattern to mirror).
