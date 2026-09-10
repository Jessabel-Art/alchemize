<?php

declare(strict_types=1);
require_once __DIR__ . "/../../server/http/request.php";
require_once __DIR__ . "/../../server/repositories/service-repository.php";
require_once __DIR__ . "/../../server/services/catalog-pricing-service.php";

final class ServiceDeletePDO extends PDO
{
  public array $calls = [];
  public bool $reject = false;
  public int $affected = 1;
  public function __construct() {}
  public function prepare(
    string $query,
    array $options = [],
  ): PDOStatement|false {
    if (
      !str_starts_with($query, "UPDATE services SET archived_at") ||
      !str_contains($query, "status = 'archived', active_flag = 0") ||
      !str_contains($query, "archived_at IS NULL")
    ) {
      throw new RuntimeException("Unsafe deletion SQL");
    }
    return new ServiceDeleteStatement($this);
  }
}
final class ServiceDeleteStatement extends PDOStatement
{
  public function __construct(private ServiceDeletePDO $db) {}
  public function execute(?array $params = null): bool
  {
    if ($this->db->reject) {
      throw new AlchemizeRequestException(
        409,
        "SERVICE_IN_USE",
        "Protected service",
      );
    }
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
$db->reject = true;
try {
  $repo->delete(92);
  throw new RuntimeException("Expected rejection");
} catch (AlchemizeRequestException $e) {
  if ($e->httpStatus !== 409 || count($db->calls) !== 1) {
    throw new RuntimeException("Rejection lost");
  }
}
echo "PASS backend rejection propagates without mutation\n";
$db->reject = false;
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
  new AlchemizeCatalogPricingService()->assertSelectable(
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
