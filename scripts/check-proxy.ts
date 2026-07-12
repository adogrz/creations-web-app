import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { config, proxy } from '../proxy'
import { UMAMI_SCRIPT_SRC } from '../components/analytics/umami-analytics'
import {
  getUmamiRequestHeaders,
  getUmamiRewriteUrl,
} from '../lib/analytics/umami-proxy'

const trustedHeaders = getUmamiRequestHeaders(
  new Headers({
    'cf-connecting-ip': '203.0.113.10',
    'x-forwarded-for': '203.0.113.11',
    'x-real-ip': '203.0.113.12',
    'x-visitor-ip': '198.51.100.9',
  }),
)

assert.equal(trustedHeaders.get('x-visitor-ip'), '198.51.100.9')
assert.equal(trustedHeaders.has('cf-connecting-ip'), false)
assert.equal(trustedHeaders.has('x-forwarded-for'), false)
assert.equal(trustedHeaders.has('x-real-ip'), false)
assert.equal(getUmamiRequestHeaders(new Headers()).has('x-visitor-ip'), false)
assert.equal(UMAMI_SCRIPT_SRC, '/stats/script.js')
assert.equal(
  getUmamiRewriteUrl(
    'https://analytics.example.com',
    '/stats/script.js',
    '',
  ).toString(),
  'https://analytics.example.com/script.js',
)
assert.equal(
  getUmamiRewriteUrl(
    'https://analytics.example.com',
    '/stats/api/send',
    '?site=creations',
  ).toString(),
  'https://analytics.example.com/api/send?site=creations',
)

async function checkProxyRoute() {
  const response = await proxy(
    new NextRequest('https://creations.example/stats/script.js'),
  )
  assert.equal(
    response.headers.get('x-middleware-rewrite'),
    'https://analytics.adogrz.com/script.js',
  )
  assert.deepEqual(config.matcher, ['/admin/:path*', '/stats/:path*'])
}

void checkProxyRoute()
