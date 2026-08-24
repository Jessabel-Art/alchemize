<?php

declare(strict_types=1);

final class AlchemizeIntakeAdminService
{
    public function __construct(private readonly AlchemizeIntakeRepository $repository, private readonly AlchemizeActivityRepository $activities) {}

    public function list(): array { return ['items' => $this->repository->listAdmin(), 'definitions' => $this->definitionSummary()]; }

    public function get(string $id): array
    {
        $assignment = $this->repository->findAdmin($id); if ($assignment === null) $this->notFound();
        return ['assignment' => $assignment, 'responses' => $this->repository->responses((int) $assignment['id'], (int) $assignment['client_id']), 'requirements' => $this->repository->requirements((int) $assignment['id']), 'definition' => alchemize_intake_definitions()[$assignment['family_key']] ?? null];
    }

    public function assign(array $user, array $payload): array
    {
        $definitions = alchemize_intake_definitions(); $family = (string) ($payload['family_key'] ?? '');
        if (!isset($definitions[$family])) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a valid intake family.');
        $engagement = $this->repository->engagementForAssignment((string) ($payload['engagement_id'] ?? ''), (string) ($payload['client_id'] ?? ''));
        if ($engagement === null) $this->notFound();
        $available = array_column($definitions[$family]['modules'], 'key');
        $modules = array_values(array_unique(array_filter((array) ($payload['module_keys'] ?? $available), static fn ($module) => in_array($module, $available, true))));
        if ($modules === []) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select at least one intake module.');
        $database = $this->repository->database(); $database->beginTransaction();
        try {
            $publicId = alchemize_uuid_v4();
            $assignmentId = $this->repository->createAssignment(['public_id' => $publicId, 'client_id' => $engagement['client_id'], 'engagement_id' => $engagement['id'], 'family_key' => $family, 'module_keys' => json_encode($modules, JSON_THROW_ON_ERROR), 'assigned_by_user_id' => $user['user_id'], 'assigned_to_user_id' => isset($payload['assigned_to_user_id']) ? (int) $payload['assigned_to_user_id'] : null, 'due_date' => trim((string) ($payload['due_date'] ?? '')) ?: null]);
            foreach ($definitions[$family]['modules'] as $module) {
                if (!in_array($module['key'], $modules, true)) continue;
                foreach ($module['requirements'] as $requirement) {
                    $existing = $this->repository->reusableDocument((int) $engagement['client_id'], $requirement['key'], $requirement['name']);
                    $this->repository->createRequirement(['public_id' => alchemize_uuid_v4(), 'intake_assignment_id' => $assignmentId, 'client_id' => $engagement['client_id'], 'engagement_id' => $engagement['id'], 'requirement_key' => $requirement['key'], 'requirement_name' => $requirement['name'], 'requirement_type' => $requirement['type'], 'necessity' => $requirement['necessity'], 'status' => $existing ? 'already_on_file' : 'missing', 'document_id' => $existing['id'] ?? null]);
                }
            }
            $this->activities->create(['public_id' => alchemize_uuid_v4(), 'event_type' => 'admin.intake.assigned', 'actor_type' => 'staff', 'actor_user_id' => $user['user_id'], 'entity_type' => 'intake', 'entity_id' => $publicId, 'client_id' => $engagement['client_id'], 'engagement_id' => $engagement['id'], 'summary' => 'Alchemize assigned an engagement intake.', 'visibility' => 'both']);
            $database->commit(); return ['id' => $publicId, 'status' => 'assigned'];
        } catch (Throwable $error) { if ($database->inTransaction()) $database->rollBack(); throw $error; }
    }

    public function review(string $id, array $user, array $payload): array
    {
        $assignment = $this->repository->findAdmin($id); if ($assignment === null) $this->notFound();
        $status = (string) ($payload['status'] ?? ''); if (!in_array($status, ['under_review','changes_requested','approved','archived'], true)) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a valid review status.');
        $this->repository->updateAssignment((int) $assignment['id'], ['status' => $status, 'client_visible_review_note' => trim((string) ($payload['client_visible_review_note'] ?? '')) ?: null, 'internal_review_notes' => trim((string) ($payload['internal_review_notes'] ?? '')) ?: null, 'blocking_reason' => trim((string) ($payload['blocking_reason'] ?? '')) ?: null, 'reviewed_at' => date('Y-m-d H:i:s.u'), 'reviewed_by_user_id' => $user['user_id']]);
        return ['id' => $id, 'status' => $status];
    }

    public function reviewRequirement(string $assignmentId,string $requirementId,string $decision,array $user,array $payload):array
    {
        $assignment=$this->repository->findAdmin($assignmentId);if($assignment===null)$this->notFound();$requirement=$this->repository->findRequirement($requirementId,$assignmentId,(int)$assignment['client_id'],true);if($requirement===null||$requirement['document_id']===null)$this->notFound();if(!in_array($decision,['accept','replacement'],true))throw new AlchemizeRequestException(422,'VALIDATION_ERROR','Select a valid document decision.');$clientNote=trim((string)($payload['reason']??''))?:null;$internalNote=trim((string)($payload['internal_note']??''))?:null;if($decision==='replacement'&&$clientNote===null)throw new AlchemizeRequestException(422,'VALIDATION_ERROR','Provide a concise replacement reason.');$status=$decision==='accept'?'accepted':'replacement_requested';$this->repository->reviewRequirementDocument((int)$requirement['document_id'],$status,(int)$user['user_id'],$clientNote,$internalNote);$this->repository->updateRequirement((int)$requirement['id'],['status'=>$status,'notes'=>$clientNote]);$this->repository->addRequirementHistory((int)$requirement['id'],(int)$requirement['document_id'],$status,$clientNote,(int)$user['user_id']);return ['requirement_id'=>$requirementId,'status'=>$status];
    }

    private function definitionSummary(): array { $result = []; foreach (alchemize_intake_definitions() as $key => $definition) $result[] = ['key' => $key, 'label' => $definition['label'], 'modules' => array_map(static fn ($module) => ['key' => $module['key'], 'title' => $module['title']], $definition['modules'])]; return $result; }
    private function notFound(): never { throw new AlchemizeRequestException(404, 'NOT_FOUND', 'The requested intake was not found.'); }
}
