import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_ROUTE_PATHS } from '../scripts/lib/react-routes.js';

test('public routes expose the required business-services architecture', () => {
  assert.ok(APP_ROUTE_PATHS.includes('/web-digital'));
  assert.ok(APP_ROUTE_PATHS.includes('/resources/meet-the-founder'));
  assert.ok(!APP_ROUTE_PATHS.includes('/services/individuals/insurance'));
});
