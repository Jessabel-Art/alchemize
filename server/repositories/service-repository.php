<?php

declare(strict_types=1);

final class AlchemizeServiceRepository
{
    public function __construct(private readonly PDO $database) {}

    public function listAll(): array
    {
        $statement = $this->database->query('SELECT * FROM services ORDER BY sort_order ASC, service_name ASC');
        return array_map(fn (array $row): array => $this->withCatalogRelations($row), $statement->fetchAll());
    }

    public function findById(int $id): ?array
    {
        $statement = $this->database->prepare('SELECT * FROM services WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();
        return is_array($row) ? $this->withCatalogRelations($row) : null;
    }

    public function listPublic(): array
    {
        $statement = $this->database->query(
            "SELECT id, service_code, service_name, public_name, description, audience,
                    category, catalog_status, pricing_type, default_price, currency, active_flag,
                    sort_order, catalog_version, billing_description
             FROM services
             WHERE catalog_status NOT IN ('NOT_OFFERED','FUTURE_EXPANSION')
             ORDER BY sort_order, service_name"
        );
        return array_map(fn (array $row): array => $this->withPublicCatalogRelations($row), $statement->fetchAll());
    }

    public function findTier(int $id): ?array
    {
        $statement = $this->database->prepare('SELECT * FROM service_tiers WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function calculate(int $serviceId, ?int $tierId, array $inputs): array
    {
        $service = $this->findById($serviceId);
        if ($service === null) throw new AlchemizeRequestException(404, 'NOT_FOUND', 'Service was not found.');
        $tier = $tierId === null ? null : $this->findTier($tierId);
        if ($tierId !== null && ($tier === null || (int) $tier['service_id'] !== $serviceId)) throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Tier does not belong to the selected service.');
        (new AlchemizeCatalogPricingService())->assertSelectable($service, $tier);
        return (new AlchemizeCatalogPricingService())->calculate((string) $service['service_code'], (string) ($tier['tier_key'] ?? ($inputs['tier_key'] ?? '')), $inputs)
            + ['service_id' => $serviceId, 'tier_id' => $tierId, 'catalog_version' => (string) ($tier['catalog_version'] ?? $service['catalog_version'])];
    }

    private function withCatalogRelations(array $service): array
    {
        $tiers = $this->database->prepare('SELECT * FROM service_tiers WHERE service_id = :service_id ORDER BY sort_order, tier_name');
        $tiers->execute(['service_id' => $service['id']]);
        $addons = $this->database->prepare('SELECT * FROM service_addons WHERE service_id = :service_id AND archived_at IS NULL ORDER BY name');
        $addons->execute(['service_id' => $service['id']]);
        $service['tiers'] = $tiers->fetchAll();
        $service['add_ons'] = $addons->fetchAll();
        return $service;
    }

    private function withPublicCatalogRelations(array $service): array
    {
        $serviceId = (int) $service['id'];
        unset($service['id']);
        $tiers = $this->database->prepare(
            "SELECT tier_key, tier_name, description, base_price, minimum_price,
                    billing_frequency, pricing_type, status, included_scope, limits_metadata,
                    pricing_metadata, invoice_description, active_flag, sort_order, catalog_version
             FROM service_tiers WHERE service_id = :service_id
               AND status NOT IN ('NOT_OFFERED','FUTURE_EXPANSION')
             ORDER BY sort_order, tier_name"
        );
        $tiers->execute(['service_id' => $serviceId]);
        $addons = $this->database->prepare(
            "SELECT add_on_code, name, description, pricing_method, default_price,
                    unit, pricing_metadata, active_flag
             FROM service_addons WHERE service_id = :service_id AND archived_at IS NULL
             ORDER BY name"
        );
        $addons->execute(['service_id' => $serviceId]);
        $service['tiers'] = array_map(function (array $tier): array {
            $limits = json_decode((string) ($tier['limits_metadata'] ?? ''), true);
            if (is_array($limits)) {
                unset($limits['implementation_hours'], $limits['max_internal_hours'], $limits['expected_labor_hours']);
                $tier['limits_metadata'] = json_encode($limits, JSON_THROW_ON_ERROR);
            }
            return $tier;
        }, $tiers->fetchAll());
        $service['add_ons'] = $addons->fetchAll();
        return $service;
    }

    public function assignToClient(int $clientId, int $serviceId, ?int $tierId, array $payload): array
    {
        $service = $this->findById($serviceId);
        $tier = $tierId === null ? null : $this->findTier($tierId);
        if ($service === null || ($tierId !== null && ($tier === null || (int) $tier['service_id'] !== $serviceId))) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'Select a valid catalog service and tier.');
        }
        (new AlchemizeCatalogPricingService())->assertSelectable($service, $tier);

        $baseCatalogPrice = $tier['base_price'] ?? $tier['minimum_price'] ?? $service['default_price'];
        if ($baseCatalogPrice === null || (float) $baseCatalogPrice <= 0) {
            $baseCatalogPrice = $service['default_price'];
        }
        if ($baseCatalogPrice === null || (float) $baseCatalogPrice <= 0) {
            throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'This catalog item does not have an approved base price available.');
        }

        $useCustomPrice = filter_var($payload['use_custom_price'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $customOverride = null;
        if ($useCustomPrice) {
            $customOverride = isset($payload['custom_price_override']) && $payload['custom_price_override'] !== '' ? max(0, (float) $payload['custom_price_override']) : null;
            if ($customOverride === null || (float) $customOverride <= 0) {
                throw new AlchemizeRequestException(422, 'VALIDATION_ERROR', 'A valid custom or SOW price is required before assignment can be saved.');
            }
        }

        $agreed = $customOverride ?? (float) $baseCatalogPrice;
        $snapshot = [
            'service_name' => $service['service_name'],
            'tier_name' => $tier['tier_name'] ?? null,
            'pricing_type' => $tier['pricing_type'] ?? $service['pricing_type'],
            'base_catalog_price' => (float) $baseCatalogPrice,
            'agreed_price' => (float) $agreed,
            'add_ons' => (array) ($payload['selected_addons'] ?? []),
            'billing_frequency' => $payload['billing_frequency'] ?? $tier['billing_frequency'] ?? $service['billing_type'],
            'catalog_version' => $tier['catalog_version'] ?? $service['catalog_version'],
            'assigned_at' => date(DATE_ATOM),
            'custom_price_override' => $customOverride !== null ? (float) $customOverride : null,
            'use_custom_price' => $useCustomPrice,
        ];

        $startDate = trim((string) ($payload['start_date'] ?? '')) ?: null;
        $status = in_array(($payload['status'] ?? 'active'), ['proposed', 'active', 'paused', 'completed', 'cancelled'], true) ? $payload['status'] : 'active';
        $notes = trim((string) ($payload['notes'] ?? '')) ?: null;
        $engagementTitle = trim((string) ($payload['engagement_title'] ?? $service['service_name'] . ($tier !== null ? ' — ' . $tier['tier_name'] : '')));
        $description = trim((string) ($payload['description'] ?? $notes ?? '')) ?: null;

        $this->database->beginTransaction();
        try {
            $assignmentId = null;
            $assignmentStatement = $this->database->prepare('INSERT INTO client_service_assignments (public_id,client_id,service_id,tier_id,agreed_base_price,agreed_recurring_amount,custom_price_override,selected_addons,billing_frequency,start_date,status,pricing_snapshot,catalog_version,notes) VALUES (:public_id,:client_id,:service_id,:tier_id,:agreed_base_price,:agreed_recurring_amount,:custom_price_override,:selected_addons,:billing_frequency,:start_date,:status,:pricing_snapshot,:catalog_version,:notes)');
            $publicId = alchemize_uuid_v4();
            $assignmentStatement->execute([
                'public_id' => $publicId,
                'client_id' => $clientId,
                'service_id' => $serviceId,
                'tier_id' => $tierId,
                'agreed_base_price' => number_format((float) $agreed, 2, '.', ''),
                'agreed_recurring_amount' => isset($payload['agreed_recurring_amount']) && $payload['agreed_recurring_amount'] !== '' ? number_format((float) $payload['agreed_recurring_amount'], 2, '.', '') : null,
                'custom_price_override' => $customOverride !== null ? number_format((float) $customOverride, 2, '.', '') : null,
                'selected_addons' => json_encode((array) ($payload['selected_addons'] ?? []), JSON_THROW_ON_ERROR),
                'billing_frequency' => $snapshot['billing_frequency'],
                'start_date' => $startDate,
                'status' => $status,
                'pricing_snapshot' => json_encode($snapshot, JSON_THROW_ON_ERROR),
                'catalog_version' => $snapshot['catalog_version'],
                'notes' => $notes,
            ]);
            $assignmentId = (int) $this->database->lastInsertId();

            $engagementPublicId = alchemize_uuid_v4();
            $engagementStatement = $this->database->prepare(
                'INSERT INTO engagements (public_id, engagement_number, client_id, title, description, status, start_date, target_date, billing_arrangement, scope_notes, pricing_notes) VALUES (:public_id, :engagement_number, :client_id, :title, :description, :status, :start_date, :target_date, :billing_arrangement, :scope_notes, :pricing_notes)'
            );
            $engagementNumber = trim((string) ($payload['engagement_number'] ?? 'ENG-' . $clientId . '-' . time()));
            $engagementStatus = in_array((string) ($payload['engagement_status'] ?? 'preparing'), ['preparing','waiting_on_client','waiting_on_alchemize','scheduled','in_progress','review','ready_for_client','completed','archived'], true)
                ? (string) $payload['engagement_status']
                : 'preparing';
            $engagementStatement->execute([
                'public_id' => $engagementPublicId,
                'engagement_number' => $engagementNumber,
                'client_id' => $clientId,
                'title' => $engagementTitle !== '' ? $engagementTitle : ($service['service_name'] . ($tier !== null ? ' — ' . $tier['tier_name'] : '')),
                'description' => $description,
                'status' => $engagementStatus,
                'start_date' => $startDate,
                'target_date' => trim((string) ($payload['target_date'] ?? '')) ?: null,
                'billing_arrangement' => $snapshot['billing_frequency'] ?? null,
                'scope_notes' => $notes,
                'pricing_notes' => $customOverride !== null ? 'Custom / SOW price: ' . number_format((float) $customOverride, 2, '.', '') : 'Catalog price snapshot: ' . number_format((float) $agreed, 2, '.', ''),
            ]);
            $engagementId = (int) $this->database->lastInsertId();

            $itemStatement = $this->database->prepare(
                'INSERT INTO engagement_service_items (public_id, engagement_id, service_id, service_code_snapshot, service_name_snapshot, description_snapshot, catalog_default_price_snapshot, negotiated_unit_price, quantity, billing_type_snapshot, scope_notes) VALUES (:public_id, :engagement_id, :service_id, :service_code_snapshot, :service_name_snapshot, :description_snapshot, :catalog_default_price_snapshot, :negotiated_unit_price, :quantity, :billing_type_snapshot, :scope_notes)'
            );
            $itemStatement->execute([
                'public_id' => alchemize_uuid_v4(),
                'engagement_id' => $engagementId,
                'service_id' => $serviceId,
                'service_code_snapshot' => $service['service_code'] ?? null,
                'service_name_snapshot' => $engagementTitle !== '' ? $engagementTitle : ($service['service_name'] . ($tier !== null ? ' — ' . $tier['tier_name'] : '')),
                'description_snapshot' => $description,
                'catalog_default_price_snapshot' => number_format((float) $baseCatalogPrice, 2, '.', ''),
                'negotiated_unit_price' => number_format((float) $agreed, 2, '.', ''),
                'quantity' => '1.00',
                'billing_type_snapshot' => $snapshot['billing_frequency'],
                'scope_notes' => $notes,
            ]);

            $this->database->commit();
            return [
                'id' => $assignmentId,
                'public_id' => $publicId,
                'engagement_id' => $engagementId,
                'engagement_public_id' => $engagementPublicId,
                'pricing_snapshot' => $snapshot,
            ];
        } catch (Throwable $error) {
            if ($this->database->inTransaction()) {
                $this->database->rollBack();
            }
            throw $error;
        }
    }

    public function findByCode(string $code): ?array
    {
        $statement = $this->database->prepare('SELECT * FROM services WHERE service_code = :service_code LIMIT 1');
        $statement->execute(['service_code' => trim($code)]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function create(array $row): int
    {
        $statement = $this->database->prepare(
            'INSERT INTO services (
                public_id, service_code, service_name, description, audience, category, status,
                default_duration, billing_type, default_price, currency, active_flag,
                billing_description, internal_pricing_notes
            ) VALUES (
                :public_id, :service_code, :service_name, :description, :audience, :category, :status,
                :default_duration, :billing_type, :default_price, :currency, :active_flag,
                :billing_description, :internal_pricing_notes
            )'
        );
        $statement->execute($row);
        return (int) $this->database->lastInsertId();
    }

    public function update(int $id, array $values): void
    {
        if ($values === []) {
            return;
        }
        $fields = [];
        foreach (array_keys($values) as $field) {
            $fields[] = sprintf('%s = :%s', $field, $field);
        }
        $sql = 'UPDATE services SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $statement = $this->database->prepare($sql);
        $values['id'] = $id;
        $statement->execute($values);
    }
}
