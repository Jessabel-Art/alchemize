import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readdirSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import test from "node:test";

test("Hostinger/local canonical storage through multipart PHP and real MySQL, with Google Drive sync disabled", async () => {
  const root = mkdtempSync(join(tmpdir(), "alchemize-drive-test-"));
  const server = spawn(
    "php",
    ["-S", "127.0.0.1:4176", "tests/php/drive-storage-http.php"],
    {
      env: {
        ...process.env,
        ALCHEMIZE_DRIVE_TEST_ROOT: root,
        ALCHEMIZE_DRIVE_TEST_SCHEMA: `alchemize_drive_test_${randomBytes(6).toString("hex")}`,
      },
      stdio: "ignore",
    },
  );
  const request = (query, options) =>
    fetch(`http://127.0.0.1:4176/?${query}`, options);
  const get = async (query) => {
    const response = await request(query);
    const json = await response.json();
    assert.equal(response.status, 200, JSON.stringify(json));
    return json;
  };
  const upload = (
    query,
    bytes = "%PDF-1.4\nDisposable integration content\n%%EOF",
  ) => {
    const body = new FormData();
    body.set(
      "file",
      new Blob([bytes], { type: "application/pdf" }),
      "disposable.pdf",
    );
    body.set("engagement_id", "engagement-one");
    body.set("folder_id", "attacker-folder");
    return request(query, { method: "POST", body });
  };
  const localStorageKeyPattern =
    /^[0-9]+\/[0-9]+\/[0-9]+\/v[0-9]+\/[a-f0-9]{48}\.pdf$/;
  let initialized = false;
  try {
    for (let tries = 0; tries < 40; tries++) {
      try {
        await request("op=ready");
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    await get("op=setup");
    initialized = true;

    // Drive connectivity itself is preserved and still reachable...
    assert.equal((await get("op=health")).root_folder_accessible, true);

    // ...but a normal client upload never touches Drive at all: it succeeds
    // purely through Hostinger/local storage.
    const saved = await upload("op=upload&document=request-one");
    assert.equal(saved.status, 200, await saved.text());
    let state = await get("op=state");
    const first = state.submissions[0];
    assert.equal(first.client_id, 1);
    assert.equal(state.documents[0].engagement_id, 1);
    assert.match(first.storage_key, localStorageKeyPattern);
    assert.equal(first.google_drive_file_id, null);
    assert.equal(first.original_filename, "disposable.pdf");
    assert.equal(first.mime_type, "application/pdf");
    assert.ok(first.file_size_bytes > 0);
    assert.equal(first.sha256.length, 64);
    assert.equal(first.submitted_by_user_id, 7);
    assert.equal(state.documents[0].status, "received");
    assert.equal(
      Object.keys(state.google.files).length,
      0,
      "no Drive folder or file should be created while sync is disabled",
    );
    assert.equal(
      state.clients[0].google_drive_folder_id,
      null,
      "no client folder should be provisioned while sync is disabled",
    );
    assert.ok(
      existsSync(join(root, "staging", first.storage_key)),
      "the uploaded file must actually exist in Hostinger/local storage",
    );

    const download = await request("op=download&document=request-one");
    const bytes = await download.text();
    assert.match(bytes, /Disposable integration content/);
    const admin = await request(
      `op=admin-download&submission=${first.public_id}`,
    );
    assert.equal(await admin.text(), bytes);
    assert.match(admin.headers.get("content-disposition"), /^inline/);
    assert.equal(
      (await request("op=download&document=request-one&client=2")).status,
      404,
    );
    assert.equal(
      (await request("op=download&document=not-a-real-identifier")).status,
      404,
    );
    assert.equal((await upload("op=upload&document=internal-one")).status, 404);
    assert.equal(
      (await request("op=download&document=internal-one")).status,
      404,
    );
    assert.equal((await upload("op=upload&document=request-two")).status, 404);
    assert.equal(
      (await upload("op=upload&document=request-two&client=2")).status,
      200,
    );
    state = await get("op=state");
    assert.equal(state.clients[1].google_drive_folder_id, null);

    await get("op=resubmit");
    assert.equal(
      (
        await upload(
          "op=upload&document=request-one",
          "%PDF-1.4\nReplacement\n%%EOF",
        )
      ).status,
      200,
    );
    state = await get("op=state");
    assert.equal(state.submissions[2].version_number, 2);
    assert.equal(state.submissions[2].google_drive_file_id, null);
    assert.notEqual(state.submissions[2].storage_key, first.storage_key);
    assert.match(
      await (await request("op=download&document=request-one")).text(),
      /Replacement/,
    );

    // A Drive failure (simulated via &fail=1, which the disabled sync path
    // never reaches) must not fail an otherwise valid Hostinger upload.
    assert.equal(
      (await upload("op=upload&document=request-failure&fail=1")).status,
      200,
    );
    state = await get("op=state");
    assert.equal(state.documents[3].status, "received");
    assert.equal(
      Object.keys(state.google.files).length,
      0,
      "a simulated Drive failure must never be attempted while sync is disabled",
    );

    // A genuine database failure (unrelated to Drive) must still roll back
    // cleanly and discard the local file that was staged for it.
    const stagedBefore = readdirSync(join(root, "staging"), {
      recursive: true,
      withFileTypes: true,
    }).filter((entry) => entry.isFile()).length;
    assert.equal(
      (await upload("op=upload&document=request-db-failure&dbfail=1")).status,
      500,
    );
    const stagedAfter = readdirSync(join(root, "staging"), {
      recursive: true,
      withFileTypes: true,
    }).filter((entry) => entry.isFile()).length;
    assert.equal(
      stagedAfter,
      stagedBefore,
      "the rolled-back upload's staged file must be discarded, not left behind",
    );
    state = await get("op=state");
    assert.equal(state.documents[4].status, "requested");
    assert.equal(state.submissions.length, 4);
    assert.equal(Object.keys(state.google.files).length, 0);

    assert.equal((await upload("op=general")).status, 200);
    assert.equal((await upload("op=general&fail=1")).status, 200);
    state = await get("op=state");
    assert.equal(state.documents.length, 7);
    assert.equal(state.submissions.length, 6);
    assert.ok(
      state.submissions.every(
        (submission) => submission.google_drive_file_id === null,
      ),
    );

    assert.equal((await get("op=legacy")).bytes, "%PDF-legacy");

    const files = readdirSync(join(root, "staging"), {
      recursive: true,
      withFileTypes: true,
    }).filter((entry) => entry.isFile());
    assert.ok(
      files.length > 0,
      "successful uploads must keep their files in Hostinger/local storage permanently",
    );
  } finally {
    if (initialized) await get("op=cleanup");
    server.kill();
    await new Promise((resolve) => server.once("exit", resolve));
    rmSync(root, { recursive: true, force: true });
  }
});
