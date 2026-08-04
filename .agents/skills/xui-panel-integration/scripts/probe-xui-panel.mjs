#!/usr/bin/env node
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

const DEFAULT_TIMEOUT_MS = 12000;

function usage() {
  console.error(`Usage:
  node probe-xui-panel.mjs --base-url URL --username USER --password PASS [--web-path /] [--insecure] [--status] [--timeout-ms 12000]

Environment fallbacks:
  XUI_BASE_URL, XUI_WEB_PATH, XUI_USERNAME, XUI_PASSWORD, XUI_TIMEOUT_MS, XUI_INSECURE=1

Read-only probe:
  1. POST /login
  2. GET /panel/api/inbounds/list
  3. optional GET /panel/api/server/status`);
}

function parseArgs(argv) {
  const args = {
    baseUrl: process.env.XUI_BASE_URL,
    webPath: process.env.XUI_WEB_PATH ?? '/',
    username: process.env.XUI_USERNAME,
    password: process.env.XUI_PASSWORD,
    insecure: ['1', 'true', 'yes'].includes(String(process.env.XUI_INSECURE ?? '').toLowerCase()),
    status: false,
    timeoutMs: Number.parseInt(process.env.XUI_TIMEOUT_MS ?? '', 10) || DEFAULT_TIMEOUT_MS
  };

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];

    if (key === '--insecure') {
      args.insecure = true;
      continue;
    }

    if (key === '--status') {
      args.status = true;
      continue;
    }

    const value = argv[index + 1];

    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${key}`);
    }

    index += 1;

    switch (key) {
      case '--base-url':
        args.baseUrl = value;
        break;
      case '--web-path':
        args.webPath = value;
        break;
      case '--username':
        args.username = value;
        break;
      case '--password':
        args.password = value;
        break;
      case '--timeout-ms':
        args.timeoutMs = Number.parseInt(value, 10);
        break;
      default:
        throw new Error(`Unknown argument: ${key}`);
    }
  }

  if (!args.baseUrl || !args.username || !args.password) {
    throw new Error('Missing required --base-url, --username, or --password.');
  }

  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
    throw new Error('--timeout-ms must be a positive number.');
  }

  return args;
}

function normalizeBaseUrl(input) {
  const parsed = new URL(input);
  parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString().replace(/\/$/, '');
}

function normalizeWebPath(input) {
  const value = String(input ?? '').trim();

  if (!value || value === '/') {
    return '';
  }

  return `/${value.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function buildUrl(args, pathname) {
  const route = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${normalizeBaseUrl(args.baseUrl)}${normalizeWebPath(args.webPath)}${route}`;
}

function serializeCookies(headers) {
  const cookies = headers['set-cookie'];
  const values = Array.isArray(cookies) ? cookies : typeof cookies === 'string' ? [cookies] : [];
  return values
    .map((item) => item.split(';', 1)[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

function requestJson(urlValue, options = {}) {
  const url = new URL(urlValue);
  const body =
    options.body instanceof URLSearchParams
      ? options.body.toString()
      : typeof options.body === 'string'
        ? options.body
        : undefined;
  const headers = {
    Accept: 'application/json',
    ...(body ? { 'Content-Length': Buffer.byteLength(body).toString() } : {}),
    ...(options.body instanceof URLSearchParams
      ? { 'Content-Type': 'application/x-www-form-urlencoded' }
      : {}),
    ...(options.headers ?? {})
  };

  return new Promise((resolve, reject) => {
    const requestFn = url.protocol === 'https:' ? httpsRequest : httpRequest;
    const request = requestFn(
      url,
      {
        method: options.method ?? 'GET',
        headers,
        rejectUnauthorized: !options.insecure
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        response.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let payload;

          try {
            payload = JSON.parse(text);
          } catch {
            reject(new Error(`Invalid JSON from ${url.pathname} (HTTP ${response.statusCode ?? 0}).`));
            return;
          }

          resolve({
            statusCode: response.statusCode ?? 0,
            headers: response.headers,
            payload
          });
        });
      }
    );

    request.setTimeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS, () => {
      request.destroy(new Error(`Timed out after ${options.timeoutMs ?? DEFAULT_TIMEOUT_MS}ms.`));
    });
    request.on('error', reject);

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

function assertEnvelope(response, fallbackMessage) {
  if (response.statusCode < 200 || response.statusCode >= 300 || response.payload?.success !== true) {
    throw new Error(response.payload?.msg?.trim() || `${fallbackMessage} (HTTP ${response.statusCode}).`);
  }

  return response.payload.obj;
}

function summarizeInbound(inbound) {
  let clients = [];

  try {
    const settings = typeof inbound.settings === 'string' ? JSON.parse(inbound.settings) : inbound.settings;
    clients = Array.isArray(settings?.clients) ? settings.clients : [];
  } catch {
    clients = [];
  }

  return {
    id: inbound.id,
    remark: inbound.remark,
    protocol: inbound.protocol,
    enable: inbound.enable,
    port: inbound.port,
    clientCount: clients.length,
    trafficRows: Array.isArray(inbound.clientStats) ? inbound.clientStats.length : 0
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const form = new URLSearchParams();
  form.set('username', args.username);
  form.set('password', args.password);
  form.set('twoFactorCode', '');

  const loginResponse = await requestJson(buildUrl(args, '/login'), {
    method: 'POST',
    body: form,
    insecure: args.insecure,
    timeoutMs: args.timeoutMs
  });
  assertEnvelope(loginResponse, 'Login failed');

  const cookie = serializeCookies(loginResponse.headers);
  if (!cookie) {
    throw new Error('Login succeeded but no session cookie was returned.');
  }

  const inboundsResponse = await requestJson(buildUrl(args, '/panel/api/inbounds/list'), {
    headers: { Cookie: cookie },
    insecure: args.insecure,
    timeoutMs: args.timeoutMs
  });
  const inbounds = assertEnvelope(inboundsResponse, 'Inbound list failed');

  const output = {
    login: 'ok',
    webPath: args.webPath || '/',
    inbounds: {
      count: Array.isArray(inbounds) ? inbounds.length : 0,
      sample: Array.isArray(inbounds) ? inbounds.slice(0, 5).map(summarizeInbound) : []
    }
  };

  if (args.status) {
    const statusResponse = await requestJson(buildUrl(args, '/panel/api/server/status'), {
      headers: { Cookie: cookie },
      insecure: args.insecure,
      timeoutMs: args.timeoutMs
    });
    output.serverStatus = assertEnvelope(statusResponse, 'Server status failed');
  }

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  if (error instanceof Error && (error.message.startsWith('Missing ') || error.message.startsWith('Unknown argument'))) {
    usage();
  }

  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
