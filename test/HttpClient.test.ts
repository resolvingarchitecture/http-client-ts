import assert from "node:assert/strict";
import { createServer as createHttpServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import type { AddressInfo } from "node:net";
import { test } from "node:test";

import { Action, Envelope, HEADER_CONTENT_TYPE, SimpleExternalRoute } from "@resolvingarchitecture/ra-common";

import { HttpClient } from "../src/index.js";

// Self-signed, CN=localhost, 10y validity - test-only, never used to verify anything real.
const CERT = `-----BEGIN CERTIFICATE-----
MIIDCTCCAfGgAwIBAgIUKV/QYEeF37Q1EnUcqewVoqcuHkUwDQYJKoZIhvcNAQEL
BQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTI2MDkxNTAwMDQyM1oXDTM2MDkx
MjAwMDQyM1owFDESMBAGA1UEAwwJbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEAndyzk+Q52/7C6UCNY2yPVkicz6DIC4YRRajSy7jZDxLi
QZLytvnbQHmuElsNb15S6ig7V5GJhre2NldL3gl+9xJsJqNlyL31EVVEylQgj8o8
Tu4hI+5muFWbY4xybkf8hnMS6Unlx1pVWCpHP5+y0OtLAKIpyzuv5N3+7Ctz/3Hc
+TCiJk0fcRu1zGDi5RLGftY3AmidOCqHzE+2PmPnjhkuYn7Gn3XioXcaDFyHr0aB
yJqzX7UIroMaw45gLn0lHkwgM8sgMjax2zj/Zoh98Xv95FEjDYkp2L5UfkrQszRF
F2vuhcagEIpW/lNQv8u/M3UXDTqHiQzH2P/y/v62owIDAQABo1MwUTAdBgNVHQ4E
FgQUTYhvg3pLOL4H8UQBRDM/SIr7OvAwHwYDVR0jBBgwFoAUTYhvg3pLOL4H8UQB
RDM/SIr7OvAwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAIRNK
dkcmv9KVL7/yWCsTMqUCm6K5KE1U0kFj2Ukd9H7QABlFup0T9UoD1xetxaKtJSLW
25XL16GZ+RSdaFs/SjjbbBKnUSU/98IJ/nSH1McRgpVaFU/DrlPptxgIYxVjumYi
HrapG2Psu3byUTZa79otztfXmBroyRJqVqP/HCVhTl11nlz4x09KR24bSYQ9vgQf
6EI51rMoR2coc4oL7u3tNthHR2sIQNpc/4RlFbax+hiC/2t6mNg5p4LF2tY7RUlE
nwWR3N4pzIwDbSBCb0ZKwCjimXyK7fmJ33qQ7IoGcTgex+hq4NMq7PKs5R0quZsa
MvWYmHK5hyNxU/xaNw==
-----END CERTIFICATE-----`;

const KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCd3LOT5Dnb/sLp
QI1jbI9WSJzPoMgLhhFFqNLLuNkPEuJBkvK2+dtAea4SWw1vXlLqKDtXkYmGt7Y2
V0veCX73Emwmo2XIvfURVUTKVCCPyjxO7iEj7ma4VZtjjHJuR/yGcxLpSeXHWlVY
Kkc/n7LQ60sAoinLO6/k3f7sK3P/cdz5MKImTR9xG7XMYOLlEsZ+1jcCaJ04KofM
T7Y+Y+eOGS5ifsafdeKhdxoMXIevRoHImrNftQiugxrDjmAufSUeTCAzyyAyNrHb
OP9miH3xe/3kUSMNiSnYvlR+StCzNEUXa+6FxqAQilb+U1C/y78zdRcNOoeJDMfY
//L+/rajAgMBAAECggEAAXifVa/uWOsoCotYsuoqxNQQ1iPM0J3/XoeMSvGpxOC0
Y1qG2lSV8s3ghY06k0rqTIUeyMx6NjqlF7HqiNVJpvIGqqOk+5NaTmUMD6BbjX+W
ULjj6zKHlNaWYcyyLFBBY7WtukqDVU+lOlpEDA9HYBCYyZ76oWnyOM8WRsSVKHab
6DomSnymsp1Q7aqPJeYddY2DbNVEBnfDfqjLi7dk4v/F4w/QpgN+2vjGCXHOfohu
hdu1N2jQ6FXKOEhQ0QrcBB972MpbRcK9dMZq01YsVtuwNB+1O7c0NV2ggObTG5HH
3THRwt1oXWuElT1K0NuKGVPkdcfoMHUwhHlhWN5D0QKBgQDUpR1q0acFXIG+PuBc
7o5NurZHCdOPtRHF8k9mBHrfT/npICD58cx0Rty34kE0nPw8H+C9FaWtptjR3DXP
s77WhEwOuqqP5Mdg68EJEcDmRHBDWXrHTeeEhkdEXgIjx4GK7CMVgGZrRJFDZGNB
zkJ0NGkpKJ6+ewl8cF/dKk8/BQKBgQC+DDnK0TaBRCoKor7W/v7GUEPFLhF0rh3N
e1A0OS1uHhj6RAZ0CLCciBkBptP9A12cE+nGm+5wrpFCmFcEBcSfiiziieow5vGm
pPeafWJCZdnOfYh4dNcYra0NyDS7HQ1yWE95eN+TKLKoqQsp64mEK/YUd2xaqFct
vue8a/1/hwKBgQC5OkbAqHUDj4wYqu6HJOniPXTPtniJ4qDju2l8JQTfBuxbLLhs
4DpHQv66UqSX7vMscFw0eOnDtOWDEH3zOdBPThhucB1okFE4VMPmYYeVTSI5GHWB
rJOx9cGYhQb6Iavu1jjNXvZYE/cxK/3l8YQjcw/zYUW+CLC/q6dloJg8/QKBgQCb
6SG8XthtQgOPiCYx8S4Iea6vY/TUGUe/3GtW/JVlonFxVz9IEBz7vbduIHQHPKye
L8P4uNHrRXtL+/hfB3BgRhY+n1AuYDhdMzciWbyzpiUCfv/nektAJrMy/E0uOE5g
wUwp5lzcuGWhclUDRgUiFoKiFbshwLsMf3JTpPBpnwKBgGgNyWvkfyOQtYHjnyWg
iJxwrW6GGiU9VE9F++RDpyS2lY2EfhpQIDf9I4ZbB4/vretpojww8g1eiB+9jtS1
NkhqtOyu3mQE55DoQd8DgdrIB+Sngft3XALJ669CeYFEk2MXTFM50X1renQKC923
1jWRHlu9JIHiDI84hG9e2Z0A
-----END PRIVATE KEY-----`;

function listenOn(server: { listen: (port: number, host: string, cb: () => void) => unknown; address: () => unknown }): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve((server.address() as AddressInfo).port));
  });
}

test("send without a url errors", async () => {
  const client = new HttpClient();
  const env = Envelope.document();
  assert.equal(await client.send(env), false);
  assert.equal(env.errorMessages()[0], "Must provide either a URL or External Route with destination Network Peer.");
});

test("send without an action errors", async () => {
  const client = new HttpClient();
  const env = Envelope.document();
  env.url = "http://127.0.0.1:1/";
  assert.equal(await client.send(env), false);
  assert.equal(env.errorMessages()[0], "Envelope.action must be set to Post, Put, Delete, or Get");
});

test("plain HTTP GET writes the response body to envelope content", async () => {
  const server = createHttpServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("hello http");
  });
  const port = await listenOn(server);
  try {
    const client = HttpClient.fromConfig({});
    const env = Envelope.document();
    env.url = `http://127.0.0.1:${port}/`;
    env.action = Action.Get;
    assert.equal(await client.send(env), true);
    assert.equal(Buffer.from(env.content() as Uint8Array).toString(), "hello http");
  } finally {
    server.close();
  }
});

test("POST with sendContentOnly sends raw content, not the JSON envelope", async () => {
  let receivedBody = "";
  const server = createHttpServer((req, res) => {
    req.on("data", (c: Buffer) => (receivedBody += c.toString()));
    req.on("end", () => res.end("ok"));
  });
  const port = await listenOn(server);
  try {
    const client = HttpClient.fromConfig({});
    const env = Envelope.document();
    env.url = `http://127.0.0.1:${port}/`;
    env.action = Action.Post;
    env.setHeader(HEADER_CONTENT_TYPE, "text/plain");
    const route = SimpleExternalRoute.of("Test", "SEND");
    env.route = route;
    env.addContent("raw body");
    assert.equal(await client.send(env), true);
    assert.equal(receivedBody, "raw body");
  } finally {
    server.close();
  }
});

test("default User-Agent is generic, not undici's own 'node' default", async () => {
  let receivedUserAgent: string | undefined;
  const server = createHttpServer((req, res) => {
    receivedUserAgent = req.headers["user-agent"];
    res.end("ok");
  });
  const port = await listenOn(server);
  try {
    const client = HttpClient.fromConfig({});
    const env = Envelope.document();
    env.url = `http://127.0.0.1:${port}/`;
    env.action = Action.Get;
    assert.equal(await client.send(env), true);
    assert.ok(receivedUserAgent?.startsWith("Mozilla/5.0"), `got ${receivedUserAgent}`);
    assert.notEqual(receivedUserAgent, "node");
  } finally {
    server.close();
  }
});

test("blocked status code is recorded as an error message", async () => {
  const server = createHttpServer((req, res) => {
    res.writeHead(403);
    res.end();
  });
  const port = await listenOn(server);
  try {
    const client = HttpClient.fromConfig({});
    const env = Envelope.document();
    env.url = `http://127.0.0.1:${port}/`;
    env.action = Action.Get;
    assert.equal(await client.send(env), false);
    assert.equal(env.errorMessages()[0], "403");
  } finally {
    server.close();
  }
});

test("HTTPS GET with trustAllCerts against a self-signed server", async () => {
  const server = createHttpsServer({ cert: CERT, key: KEY }, (req, res) => {
    res.writeHead(200);
    res.end("hello https");
  });
  const port = await listenOn(server);
  try {
    const client = HttpClient.fromConfig({ "ra.http.client.trustAllCerts": "true" });
    const env = Envelope.document();
    env.url = `https://127.0.0.1:${port}/`;
    env.action = Action.Get;
    assert.equal(await client.send(env), true);
    assert.equal(Buffer.from(env.content() as Uint8Array).toString(), "hello https");
    await client.stop();
  } finally {
    server.close();
  }
});
