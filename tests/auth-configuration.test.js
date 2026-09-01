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

test("production auth diagnostics are CLI-only and never print configuration values", () => {
  const diagnostic = read("scripts/production-auth-diagnostics.php");
  assert.match(diagnostic, /PHP_SAPI !== 'cli'/);
  for (const status of [
    "DATABASE_CONFIG",
    "DATABASE_CONNECTION",
    "PDO_DRIVER",
    "COMPOSER_AUTOLOAD",
    "SESSION_WRITE",
    "AUTH_REPOSITORY",
  ]) {
    assert.match(diagnostic, new RegExp(status));
  }
  assert.doesNotMatch(diagnostic, /echo[^;]*(host|password|user|dsn)/i);
});

test("auth failures log safe stages while returning one production-safe response", () => {
  const endpoint = read("api/v1/auth/index.php");
  assert.match(endpoint, /bootstrap unavailable/);
  assert.match(endpoint, /failure at %s \[%s\]/);
  assert.doesNotMatch(endpoint, /failure \[%s\]: %s/);
  assert.match(endpoint, /Authentication is temporarily unavailable\./);
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

test("registration requests are submitted as lead-intake instead of blocking creation", () => {
  const authPage = read("src/pages/auth/AuthPage.jsx");
  const apiClient = read("src/services/admin-api.js");

  assert.match(authPage, /requestAccess/);
  assert.match(authPage, /auth\.requestAccess/);
  assert.doesNotMatch(authPage, /Account creation is not enabled in this phase\./);
  assert.match(apiClient, /requestAccess:\s*\(/);
  assert.match(apiClient, /buildApiUrl\("leads"\)/);
});

test("admin manual lead creation persists through the authenticated lead API", () => {
  const apiClient = read("src/services/admin-api.js");
  const adminPage = read("src/pages/admin/AdminOperationalPages.jsx");

  assert.match(apiClient, /create:\s*\(payload\)\s*=>\s*apiRequest\(buildApiUrl\("leads"\),\s*\{\s*method:\s*"POST"/);
  assert.match(adminPage, /leadApi\.create\(/);
  assert.doesNotMatch(adminPage, /Manual lead draft created locally\./);
});
