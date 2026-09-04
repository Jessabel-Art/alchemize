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

test("service assignment payload without status defaults assignment to active while engagement stays preparing", () => {
  assert.match(
    serviceRepository,
    /\$assignmentStatus\s*=\s*\(string\)\s*\(\$payload\['status'\]\s*\?\?\s*'active'\)/,
  );
  assert.match(
    serviceRepository,
    /\$status\s*=\s*in_array\(\s*\$assignmentStatus,\s*\['proposed',\s*'active',\s*'paused',\s*'completed',\s*'cancelled'\],\s*true\s*\)\s*\?\s*\$assignmentStatus\s*:\s*'active';/s,
  );
  assert.doesNotMatch(
    serviceRepository,
    /\?\s*\$payload\['status'\]\s*:\s*'active'/,
  );
  assert.match(
    serviceRepository,
    /\$engagementStatus\s*=\s*in_array\(\s*\(string\)\s*\(\$payload\['engagement_status'\]\s*\?\?\s*'preparing'\),\s*\['preparing','waiting_on_client','waiting_on_alchemize','scheduled','in_progress','review','ready_for_client','completed','archived'\],\s*true\s*\)\s*\?\s*\(string\)\s*\$payload\['engagement_status'\]\s*:\s*'preparing';/s,
  );
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
