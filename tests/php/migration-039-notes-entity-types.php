<?php
// The Client Requests "Notes" action needs to attach internal/admin-only
// notes to a document request, task, or intake-form submission -- the
// existing notes architecture (server/repositories/note-repository.php,
// api/v1/notes/index.php) already supports arbitrary entity types at the
// application layer, but notes.entity_type only ever allowed
// ('lead','client','engagement') at the schema level. This test runs the
// migration file itself against the real local dev database and proves
// the widened ENUM accepts the three new entity types while the original
// three keep working, and that re-running the migration is a safe no-op.
// Skipped (not failed) if that database is unreachable, matching the
// convention already used by tests/php/migration-03*.php.
declare(strict_types=1);

function verifyMigration039(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}

putenv('ALCHEMIZE_DB_HOST=127.0.0.1');
putenv('ALCHEMIZE_DB_PORT=3306');
putenv('ALCHEMIZE_DB_NAME=alchemize_dev');
putenv('ALCHEMIZE_DB_USER=alchemize_dev_user');
putenv('ALCHEMIZE_DB_PASSWORD=AryahLeo1017!');

require_once __DIR__.'/../../server/config/config.php';
require_once __DIR__.'/../../server/database/connection.php';

$config = alchemize_config();
try {
    $db = alchemize_database($config['database']);
} catch (Throwable $error) {
    echo "SKIPPED: no local dev database reachable (" . $error->getMessage() . ").\n";
    exit(0);
}

$migrationSql = file_get_contents(__DIR__.'/../../migrations/039_expand_notes_entity_types.sql');
verifyMigration039(is_string($migrationSql) && $migrationSql !== '', 'Could not read migrations/039_expand_notes_entity_types.sql');

function columnType039(PDO $db, string $table, string $column): string {
    $stmt = $db->prepare('SELECT COLUMN_TYPE FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = :table AND column_name = :column');
    $stmt->execute(['table' => $table, 'column' => $column]);
    return (string) $stmt->fetchColumn();
}

// Reset to the pre-migration definition so this test proves the migration
// actually does the widening, not that it was already applied.
$db->exec("ALTER TABLE notes MODIFY COLUMN entity_type ENUM('lead','client','engagement') NOT NULL");
$before = columnType039($db, 'notes', 'entity_type');
verifyMigration039(!str_contains($before, "'document'"), 'Setup failed: entity_type should not yet allow document');

$db->exec($migrationSql);
$after = columnType039($db, 'notes', 'entity_type');
foreach (['lead', 'client', 'engagement', 'document', 'task', 'intake'] as $type) {
    verifyMigration039(str_contains($after, "'$type'"), "Migration did not add entity_type '$type'");
}

// A real insert/select round trip for each new type, and the original
// types still work -- not just an information_schema string check.
foreach (['document', 'task', 'intake', 'client'] as $type) {
    $db->exec("INSERT INTO notes (public_id, entity_type, entity_id, note_category, note_body) VALUES (UUID(), '$type', UUID(), 'general', 'Migration 039 test note')");
}
$count = (int) $db->query("SELECT COUNT(*) FROM notes WHERE note_body = 'Migration 039 test note'")->fetchColumn();
verifyMigration039($count === 4, 'Round-trip insert across all four entity types did not persist correctly');
$db->exec("DELETE FROM notes WHERE note_body = 'Migration 039 test note'");

// Re-running the migration (fully-applied schema) must be a safe no-op.
$db->exec($migrationSql);
$reapplied = columnType039($db, 'notes', 'entity_type');
verifyMigration039($reapplied === $after, 'Re-running the migration changed the column definition');

echo "Migration 039: notes.entity_type widened to include document/task/intake alongside lead/client/engagement, round-trips real rows for each, and re-running is a safe no-op.\n";
