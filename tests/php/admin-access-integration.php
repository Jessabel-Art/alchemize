<?php

declare(strict_types=1);

// Dedicated disposable MySQL instance only. Never reads application credentials.
require_once __DIR__ . "/../../server/http/request.php";
require_once __DIR__ . "/../../server/repositories/user-repository.php";
require_once __DIR__ . "/../../server/repositories/role-repository.php";
require_once __DIR__ .
  "/../../server/repositories/portal-account-repository.php";
require_once __DIR__ . "/../../server/repositories/audit-event-repository.php";
require_once __DIR__ . "/../../server/services/auth-service.php";
require_once __DIR__ . "/../../server/services/admin-access-service.php";
require_once __DIR__ . "/../../server/services/portal-account-service.php";
require_once __DIR__ . "/../../server/services/email-template.php";
require_once __DIR__ . "/../../server/auth/session.php";
require_once __DIR__ . "/../../server/auth/authorization.php";

function alchemize_uuid_v4(): string
{
  return bin2hex(random_bytes(16));
}
function alchemize_database(array $config): PDO
{
  return $GLOBALS["db"];
}
function alchemize_config(): array
{
  return ["database" => []];
}
function check(bool $ok, string $message): void
{
  if (!$ok) {
    throw new RuntimeException($message);
  }
  $GLOBALS["passed"][] = $message;
}
function rejects(callable $operation, int $status): void
{
  try {
    $operation();
  } catch (AlchemizeRequestException $error) {
    check(
      $error->httpStatus === $status,
      "Rejected with expected status " . $status,
    );
    return;
  }
  throw new RuntimeException("Expected rejection");
}
final class InvitationMailCapture
{
  public array $messages = [];
  public function deliver(array $payload): string
  {
    $this->messages[] = $payload;
    return "sent";
  }
  public function token(): string
  {
    parse_str(
      (string) parse_url(end($this->messages)["action_url"], PHP_URL_QUERY),
      $query,
    );
    return $query["token"];
  }
}
function alchemize_email_provider(array $config): InvitationMailCapture
{
  return $GLOBALS["mail"];
}
$mail = new InvitationMailCapture();
$passed = [];
$db = new PDO("mysql:host=127.0.0.1;port=33317;charset=utf8mb4", "root", "", [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  PDO::ATTR_EMULATE_PREPARES => false,
]);
$schema = "alchemize_access_test_" . bin2hex(random_bytes(6));
$db->exec("CREATE DATABASE " . $schema);
$db->exec("USE " . $schema);
try {
  foreach (["003_create_roles_and_users.sql"] as $migration) {
    $db->exec(file_get_contents(__DIR__ . "/../../migrations/" . $migration));
  }
  $db->exec(
    "CREATE TABLE clients (id BIGINT UNSIGNED PRIMARY KEY) ENGINE=InnoDB",
  );
  $db->exec(
    file_get_contents(
      __DIR__ . "/../../migrations/020_create_portal_account_tokens.sql",
    ),
  );
  $db->exec(
    file_get_contents(
      __DIR__ . "/../../migrations/040_admin_account_invitations.sql",
    ),
  );
  $db->exec(
    "CREATE TABLE audit_events (id BIGINT AUTO_INCREMENT PRIMARY KEY, public_id VARCHAR(36), actor_user_id BIGINT, event_type VARCHAR(100), entity_type VARCHAR(100), entity_id VARCHAR(100), action_summary TEXT, request_metadata TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
  );
  $users = new AlchemizeUserRepository($db);
  $roles = new AlchemizeRoleRepository($db);
  $owner = $users->create([
    "public_id" => alchemize_uuid_v4(),
    "email" => "owner@example.test",
    "display_name" => "Owner",
    "status" => "active",
    "password_hash" => password_hash("original-password", PASSWORD_DEFAULT),
    "role_id" => $roles->findBySlug("owner-admin")["id"],
  ]);
  $access = new AlchemizeAdminAccessService($db, [
    "app_url" => "https://app.example.test",
  ]);
  $auth = new AlchemizeAuthService($users, $roles);
  $result = $access->invite($owner, [
    "display_name" => "Invited Admin",
    "email" => "invite@example.test",
    "role_slug" => "administrator",
    "status" => "active",
  ]);
  $invited = $users->findByEmail("invite@example.test");
  $token = $mail->token();
  check(
    $invited["status"] === "invited" && $invited["password_hash"] === null,
    "Invitation cannot activate access before setup",
  );
  check(
    $result["email_delivery"] === "sent" && !isset($result["url"]),
    "Existing email provider invoked without returning raw token",
  );
  $stored = $db->query("SELECT * FROM portal_account_tokens")->fetch();
  check(
    $stored["token_hash"] === hash("sha256", $token) &&
      strlen($token) === 43 &&
      $stored["client_id"] === null,
    "Cryptographic invitation stored hashed without fake client",
  );
  $rendered = alchemize_render_email_template($mail->messages[0]);
  check(
    str_contains(json_encode($rendered), "Accept Invitation") &&
      str_contains(json_encode($rendered), "Owner has invited"),
    "Branded invitation renders inviter and acceptance link",
  );
  check(
    $access->invitations()[0]["invitation_status"] === "pending",
    "Pending invitation listed",
  );
  rejects(
    fn() => $auth->login("invite@example.test", "new-admin-password"),
    401,
  );
  $access->accept($token, "admin_invitation", "new-admin-password");
  $session = $auth->login("invite@example.test", "new-admin-password");
  check(
    $session["role_slug"] === "administrator" &&
      $users->findById($session["user_id"])["status"] === "active",
    "Accepted administrator authenticates with assigned role",
  );
  rejects(
    fn() => $access->accept($token, "admin_invitation", "replacement-password"),
    410,
  );
  rejects(
    fn() => $access->invite($session["user_id"], [
      "display_name" => "Escalation",
      "email" => "e@example.test",
      "role_slug" => "owner-admin",
    ]),
    403,
  );
  rejects(
    fn() => $access->updateMember($session["user_id"], [
      "user_id" => $owner,
      "role_slug" => "owner-admin",
      "status" => "inactive",
    ]),
    403,
  );
  rejects(
    fn() => $access->updateMember($owner, [
      "user_id" => $owner,
      "role_slug" => "administrator",
      "status" => "active",
    ]),
    409,
  );
  $access->invite($owner, [
    "display_name" => "Reader",
    "email" => "reader@example.test",
    "role_slug" => "read-only",
  ]);
  $reader = $users->findByEmail("reader@example.test");
  $oldToken = $mail->token();
  $db->exec(
    "UPDATE portal_account_tokens SET expires_at='2000-01-01' WHERE user_id=" .
      $reader["id"],
  );
  rejects(
    fn() => $access->accept($oldToken, "admin_invitation", "reader-password"),
    410,
  );
  check(
    $access->invitations()[0]["invitation_status"] === "expired",
    "Expired invitation displayed",
  );
  $access->invitationAction($owner, $reader["id"], "resend");
  $resent = $mail->token();
  check($resent !== $oldToken, "Resend rotates token and invokes provider");
  rejects(
    fn() => $access->accept($oldToken, "admin_invitation", "reader-password"),
    410,
  );
  $access->invitationAction($owner, $reader["id"], "revoke");
  rejects(
    fn() => $access->accept($resent, "admin_invitation", "reader-password"),
    410,
  );
  $access->invitationAction($owner, $reader["id"], "resend");
  $access->accept($mail->token(), "admin_invitation", "reader-password");
  alchemize_set_session_user(
    $auth->login("reader@example.test", "reader-password"),
  );
  rejects(fn() => alchemize_require_admin(), 403);
  rejects(
    fn() => $access->invite($reader["id"], [
      "display_name" => "No",
      "email" => "no@example.test",
      "role_slug" => "administrator",
    ]),
    403,
  );
  $access->updateMember($owner, [
    "user_id" => $reader["id"],
    "role_slug" => "staff",
    "status" => "active",
  ]);
  check(
    alchemize_require_staff_or_admin()["role_slug"] === "staff",
    "Role changes affect existing authenticated session",
  );
  $access->updateMember($owner, [
    "user_id" => $reader["id"],
    "role_slug" => "staff",
    "status" => "inactive",
  ]);
  rejects(fn() => alchemize_require_staff_or_admin(), 401);
  rejects(fn() => $auth->login("reader@example.test", "reader-password"), 403);
  $access->updateMember($owner, [
    "user_id" => $reader["id"],
    "role_slug" => "staff",
    "status" => "active",
  ]);
  check(
    $auth->login("reader@example.test", "reader-password")["role_slug"] ===
      "staff",
    "Reactivation works",
  );
  $profile = $auth->updateProfile(
    $owner,
    "Updated Owner",
    "owner@example.test",
  );
  check(
    $auth->getAccountSummary($owner)["user"]["display_name"] ===
      "Updated Owner",
    "Profile save persists on reread",
  );
  $auth->updateProfile($owner, "Updated Owner", "owner@example.test");
  rejects(
    fn() => $access->requestEmailChange(
      $owner,
      "new@example.test",
      "incorrect",
    ),
    401,
  );
  $access->requestEmailChange($owner, "new@example.test", "original-password");
  $emailToken = $mail->token();
  check(
    $users->findById($owner)["email"] === "owner@example.test",
    "Email stays unchanged until verification",
  );
  $access->accept($emailToken, "email_change");
  check(
    $auth->login("new@example.test", "original-password")["user_id"] === $owner,
    "Confirmed email becomes login identity",
  );
  rejects(fn() => $access->accept($emailToken, "email_change"), 410);
  $passwords = new AlchemizePortalAccountService(
    $db,
    $users,
    $roles,
    new AlchemizePortalAccountRepository($db),
    [],
  );
  rejects(
    fn() => $passwords->changePassword(
      $owner,
      "wrong-password",
      "updated-password",
    ),
    401,
  );
  $db->exec(
    "UPDATE users SET password_changed_at='2000-01-01' WHERE id=" . $owner,
  );
  $passwords->changePassword($owner, "original-password", "updated-password");
  rejects(fn() => $auth->login("new@example.test", "original-password"), 401);
  check(
    $auth->login("new@example.test", "updated-password")["user_id"] === $owner,
    "New password authenticates and old password fails",
  );
  check(
    str_starts_with($users->findById($owner)["password_changed_at"], "20") &&
      !str_starts_with($users->findById($owner)["password_changed_at"], "2000"),
    "Password changed timestamp updates each change",
  );
} finally {
  $db->exec("DROP DATABASE " . $schema);
}
foreach ($passed as $message) {
  echo "PASS " . $message . PHP_EOL;
}
echo "PASS disposable database removed" . PHP_EOL;
