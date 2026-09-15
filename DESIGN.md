# http-client (TypeScript) — Design

A plain HTTP/HTTPS client for use as the HTTP **protocol service** by a
future `1m5-core-ts`, the same role `http-client-java`'s `ra.http.HTTPService`
plays for `1m5-core-java` — but client (outbound `sendOut`) only.

## Where it sits

    (future) 1m5-core-ts  ──wraps──►  http_client.HttpClient  ──fetch (undici)──►  origin server

## Client only

`HTTPService` in `http-client-java` is two things bolted together: an
outbound HTTP/HTTPS client (`sendOut`, `connect`/`disconnect`), and a
Jetty-based local HTTP server used to host `1m5`'s own API / SPA / WebSocket
endpoints (`launch`, `EnvelopeHandler`, `SPAHandler`, `EnvelopeWebSocket`).
`tor-client-java`'s `TORClientService` extends `HTTPService` to get the
client half for free and separately uses the server half to host its hidden
service.

No other language port (`tor-client-{python,rust,cpp,cs,go,ts}`) needed the
server half — each just needs outbound requests. This port keeps to that
same scope: only the client. If a local-server need shows up later (e.g. a
future Tor hidden service in TypeScript), it's a separate addition, not a
retrofit of this class.

## Components

    HttpClient   config, status, start()/stop()/send() — all async

## Message flow

Unlike `tor-client-ts` (whose `TorClient` predates `ra_common.Envelope`
growing a typed `url`/`action`/`content()` surface, and so uses the raw
`headers["url"]`/`headers["body"]`/`headers["error"]` convention), this
client uses that typed surface directly, mirroring `http-client-java`:

- **URL**: `envelope.url`, or (no URL set) a `SimpleExternalRoute`
  destination `NetworkPeer`'s `id`, treated as `http://<id>`.
- **Method**: `envelope.action` (`Get`/`Post`/`Put`/`Delete`).
- **Headers**: `Authorization`, `Content-Type`, `Content-Disposition`,
  `Content-Transfer-Encoding`, `User-Agent` — copied from
  `envelope.header(...)` if present.
- **Body**: `envelope.multipart` if set (`multipart/form-data`); else, if
  the route is a `SimpleExternalRoute` with `sendContentOnly`,
  `envelope.content()` sent raw (string or bytes); else the whole envelope
  as JSON (`envelope.toJson()`) — same three-way choice as
  `HTTPService.sendOut`.
- **Response**: body bytes written to `envelope.addContent(...)`; a non-2xx
  status is recorded via `envelope.addErrorMessage(String(status))`, and a
  status in `{403, 408, 410, 418, 451, 511}` is additionally logged as a
  likely-blocked signal (`BLOCKED_REASONS`) — mirrors
  `HTTPService.handleFailure`, without inventing a `NetworkConnectionReport`
  type in `ra-common-ts` (none exists yet; out of scope for this repo).

## HTTP client library

Uses [`undici`](https://undici.nodejs.org/) directly (not the global
`fetch`) so a custom `Dispatcher` can be supplied per-client: a `ProxyAgent`
when `ra.http.client.proxyUrl` is set, or a plain `Agent` with
`rejectUnauthorized: false` when `ra.http.client.trustAllCerts` is set (both,
or neither). Node's global `fetch` is undici under the hood but doesn't
expose a way to swap its dispatcher without `setGlobalDispatcher` — global,
process-wide state this library doesn't want to touch.

## Status model

`Status` is its own 4-state type (`"disconnected" | "connecting" |
"connected" | "error"`), not `ra_common`'s wider `NetworkStatus` — matches
`tor-client-ts` / `i2p-ts`. `start()` builds the dispatcher (never fails, so
always ends `"connected"`); `stop()` closes it and returns to
`"disconnected"`.

## Not here

- Local HTTP server / SPA hosting / WebSocket — `http-client-java`'s Jetty
  half (`EnvelopeHandler`, `SPAHandler`, `EnvelopeWebSocket`,
  `EnvelopeJSONDataHandler`, `EnvelopeProxyDataHandler`). No other port has
  this either.
- A `NetworkConnectionReport`-equivalent type — `ra-common-ts` doesn't have
  one; blocked responses are logged and recorded as an envelope error
  message only.
- Redirect following configuration parity with `http-client-java`'s three
  separate `OkHttpClient`s (plain HTTP / compatible HTTPS / strong HTTPS) —
  `undici`'s single client handles HTTP and HTTPS uniformly; there's no
  equivalent three-way TLS strictness split.
