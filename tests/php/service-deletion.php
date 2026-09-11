<?php

declare(strict_types=1);
require_once __DIR__ . "/../../server/http/request.php";
require_once __DIR__ . "/../../server/repositories/service-repository.php";
require_once __DIR__ . "/../../server/services/catalog-pricing-service.php";

// AlchemizeServiceRepository::delete() never hard-deletes -- it always
// soft-archives (archived_at + status='archived' + active_flag=0), which by
// itself can never orphan an invoice, document, or historical engagement,
// since the row is never removed. The one real protection needed is a
// business rule, not a referential-integrity one: a service still tied to
// an active (non-completed, non-archived) engagement must not disappear
// from the catalog out from under work in progress. This test drives that
// real check (an upfront SELECT against engagement_service_items joined to
// engagements), not an injected fake rejection.
final class ServiceDeletePDO extends PDO
{
  public array $activeEngagementServiceIds = [];
  public array $calls = [];
  public int $affected = 1;
  public function __construct() {}
  public function prepare(
    string $query,
    array $options = [],
  ): PDOStatement|false {
    if (
      str_starts_with($query, "SELECT 1 FROM engagement_service_items") &&
      str_contains($query, "e.status NOT IN ('completed', 'archived')")
    ) {
      return new ServiceActiveEngagementCheckStatement($this);
    }
    if (
      str_starts_with($query, "UPDATE services SET archived_at") &&
      str_contains($query, "status = 'archived', active_flag = 0") &&
      str_contains($query, "archived_at IS NULL")
    ) {
      return new ServiceDeleteStatement($this);
    }
    throw new RuntimeException("Unsafe deletion SQL: $query");
  }
}
final class ServiceActiveEngagementCheckStatement extends PDOStatement
{
  private ?int $serviceId = null;
  public function __construct(private ServiceDeletePDO $db) {}
  public function execute(?array $params = null): bool
  {
    $this->serviceId = (int) ($params["id"] ?? 0);
    return true;
  }
  public function fetchColumn(int $column = 0): mixed
  {
    return in_array($this->serviceId, $this->db->activeEngagementServiceIds, true) ? 1 : false;
  }
}
final class ServiceDeleteStatement extends PDOStatement
{
  public function __construct(private ServiceDeletePDO $db) {}
  public function execute(?array $params = null): bool
  {
    $this->db->calls[] = $params;
    return true;
  }
  public function rowCount(): int
  {
    return $this->db->affected;
  }
}

$db = new ServiceDeletePDO();
$repo = new AlchemizeServiceRepository($db);

$repo->delete(91);
if ($db->calls !== [["id" => 91]]) {
  throw new RuntimeException("Wrong deletion target");
}
echo "PASS soft deletion updates only the service, preserving dependent records\n";

$db->activeEngagementServiceIds = [92];
try {
  $repo->delete(92);
  throw new RuntimeException("Expected rejection");
} catch (AlchemizeRequestException $e) {
  if ($e->httpStatus !== 409 || $e->errorCode !== "SERVICE_IN_USE" || count($db->calls) !== 1) {
    throw new RuntimeException("Rejection lost, or the archive UPDATE ran anyway");
  }
}
echo "PASS a service tied to an active engagement is rejected (409 SERVICE_IN_USE) without mutation\n";

// A service whose only engagements are finished (completed/archived) is not
// protected -- historical work doesn't block retiring the catalog entry.
$db->activeEngagementServiceIds = [];
$db->affected = 1;
$repo->delete(93);
if ($db->calls !== [["id" => 91], ["id" => 93]]) {
  throw new RuntimeException("A service with only completed/archived engagements was incorrectly blocked");
}
echo "PASS a service with only completed/archived engagement history can still be archived\n";

$db->affected = 0;
try {
  $repo->delete(999);
  throw new RuntimeException("Expected missing service");
} catch (AlchemizeRequestException $e) {
  if ($e->httpStatus !== 404) {
    throw $e;
  }
}
echo "PASS missing or already deleted service returns 404\n";

try {
  (new AlchemizeCatalogPricingService())->assertSelectable(
    ["archived_at" => "2026-09-10", "active_flag" => 0],
    ["active_flag" => 1, "status" => "ACTIVE"],
  );
  throw new RuntimeException("Archived service selectable via active tier");
} catch (AlchemizeRequestException $e) {
  if ($e->errorCode !== "SERVICE_NOT_SELECTABLE") {
    throw $e;
  }
}
echo "PASS archived service cannot be selected via an active tier\n";
