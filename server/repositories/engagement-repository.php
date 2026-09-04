<?php

declare(strict_types=1);

final class AlchemizeEngagementRepository
{
    public function __construct(private readonly PDO $database) {}

    public function listAll(): array
    {
        $statement = $this->database->query('SELECT e.*, esi.service_id FROM engagements e LEFT JOIN engagement_service_items esi ON esi.engagement_id = e.id AND esi.add_on_id IS NULL ORDER BY e.created_at DESC');
        return $statement->fetchAll();
    }

    public function findById(int $id): ?array
    {
        $statement = $this->database->prepare('SELECT e.*, esi.service_id, s.service_code FROM engagements e LEFT JOIN engagement_service_items esi ON esi.engagement_id=e.id AND esi.add_on_id IS NULL LEFT JOIN services s ON s.id=esi.service_id WHERE e.id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();
        return is_array($row) ? $row : null;
    }

    public function create(array $row): int
    {
        $serviceId = isset($row['service_id']) ? (int) $row['service_id'] : null;
        unset($row['service_id']);
        $statement = $this->database->prepare(
            'INSERT INTO engagements (
                public_id, engagement_number, client_id, title, description, status,
                start_date, target_date, completion_date, owner_user_id, billing_arrangement,
                scope_notes, pricing_notes
            ) VALUES (
                :public_id, :engagement_number, :client_id, :title, :description, :status,
                :start_date, :target_date, :completion_date, :owner_user_id, :billing_arrangement,
                :scope_notes, :pricing_notes
            )'
        );
        $statement->execute($row);
        $id = (int) $this->database->lastInsertId();
        if ($serviceId !== null) {
            $service = $this->database->prepare('SELECT service_code, service_name, description, default_price, billing_type FROM services WHERE id = :id');
            $service->execute(['id' => $serviceId]);
            $catalog = $service->fetch();
            if (is_array($catalog)) {
                $this->database->prepare('INSERT INTO engagement_service_items (public_id, engagement_id, service_id, service_code_snapshot, service_name_snapshot, description_snapshot, catalog_default_price_snapshot, negotiated_unit_price, billing_type_snapshot) VALUES (:public_id,:engagement_id,:service_id,:service_code,:service_name,:description,:price,:price,:billing_type)')->execute([
                    'public_id'=>alchemize_uuid_v4(),'engagement_id'=>$id,'service_id'=>$serviceId,'service_code'=>$catalog['service_code'],'service_name'=>$catalog['service_name'],'description'=>$catalog['description'],'price'=>$catalog['default_price'],'billing_type'=>$catalog['billing_type'],
                ]);
            }
        }
        return $id;
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
        $sql = 'UPDATE engagements SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $statement = $this->database->prepare($sql);
        $values['id'] = $id;
        $statement->execute($values);
    }
}
