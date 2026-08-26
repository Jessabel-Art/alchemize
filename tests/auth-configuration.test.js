import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("login is password-verified and is not CSRF-gated", () => {
  const endpoint = read("api/v1/auth/index.php");
  const service = read("server/services/auth-service.php");
  assert.match(endpoint, /POST.*\['login'\]/s);
  assert.match(endpoint, /\$auth->login\(\$email, \$password\)/);
  assert.doesNotMatch(
    endpoint.match(
      /if \(\$method === 'POST' && \$parts === \['login'\]\)[\s\S]*?\n    \}/,
    )?.[0] ?? "",
    /alchemize_require_csrf/,
  );
  assert.match(service, /password_verify\(\$password/);
  assert.match(service, /'INVALID_CREDENTIALS', 'Invalid email or password\.'/);
});

test("PHP config loads dotenv and supports conventional integration keys", () => {
  const config = read("server/config/config.php");
  assert.match(config, /alchemize_load_environment_file\(\)/);
  for (const key of [
    "APP_ENV",
    "APP_URL",
    "DB_HOST",
    "DB_PASSWORD",
    "STRIPE_PUBLISHABLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "GOOGLE_PROJECT_ID",
    "GOOGLE_APPLICATION_CREDENTIALS",
    "GOOGLE_CLIENT_ROOT_FOLDER_ID",
    "GOOGLE_CALENDAR_ID",
  ]) {
    assert.match(config, new RegExp(key));
  }
});

test("Google provider boundaries keep SDK calls out of controllers", () => {
  const factory = read("server/services/google-client-factory.php");
  const drive = read("server/services/google-drive-service.php");
  const calendar = read("server/services/google-calendar-service.php");
  assert.match(factory, /loadCredentialDocument/);
  assert.match(factory, /class_exists\(\\Google\\Client::class\)/);
  assert.match(drive, /function verifyConnection/);
  assert.match(calendar, /function verifyConnection/);
});

test("Stripe webhook reads config, raw input, and verifies signatures", () => {
  const endpoint = read("api/v1/webhooks/index.php");
  assert.match(endpoint, /file_get_contents\('php:\/\/input'\)/);
  assert.match(endpoint, /\$config\['stripe'\]\['webhook_secret'\]/);
  assert.match(endpoint, /alchemize_stripe_verify_signed_payload/);
  assert.match(endpoint, /INTEGRATION_UNAVAILABLE/);
});
