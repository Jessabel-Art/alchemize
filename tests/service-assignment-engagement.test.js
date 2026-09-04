import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const serviceRepository = readFileSync(
  new URL("../server/repositories/service-repository.php", import.meta.url),
  "utf8",
);
const clientRoute = readFileSync(
  new URL("../api/v1/clients/index.php", import.meta.url),
  "utf8",
);

test("client service assignment creates the canonical engagement and reloads it", () => {
  assert.match(
    serviceRepository,
    /INSERT INTO engagements\s*\(|INSERT INTO engagement_service_items\s*\(/,
  );
  assert.match(
    serviceRepository,
    /assignToClient\s*\(int \$clientId, int \$serviceId, \?int \$tierId, array \$payload\)/,
  );
  assert.match(
    clientRoute,
    /alchemize_json_response\(\['data'\s*=>\s*\$catalogRepository->assignToClient/, 
  );
});
