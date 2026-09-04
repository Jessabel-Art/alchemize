import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const repositorySource = fs.readFileSync(
  new URL("../server/repositories/portal-repository.php", import.meta.url),
  "utf8",
);

test("portal invoice list does not query a non-existent stripe_sync_status column", () => {
  assert.doesNotMatch(
    repositorySource,
    /i\.stripe_sync_status|stripe_sync_status/i,
  );
});
