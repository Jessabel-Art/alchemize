<?php

declare(strict_types=1);

final class AlchemizeIntakeRepository
{
    public function __construct(private readonly PDO $database) {}
    public function database(): PDO { return $this->database; }

    public function listForClient(int $clientId): array
    {
        $statement = $this->database->prepare(
            'SELECT ia.public_id AS id, ia.family_key, ia.module_keys, ia.status, ia.completion_percentage,
                    ia.due_date, ia.submitted_at, ia.client_visible_review_note, ia.blocking_reason,
                    e.public_id AS engagement_id, e.title AS engagement_title, e.status AS engagement_status,
                    u.display_name AS assigned_team_member
             FROM intake_assignments ia INNER JOIN engagements e ON e.id = ia.engagement_id
             LEFT JOIN users u ON u.id = ia.assigned_to_user_id
             WHERE ia.client_id = :client_id AND ia.archived_at IS NULL ORDER BY ia.created_at DESC'
        );
        $statement->execute(['client_id' => $clientId]);
        return array_map([$this, 'decodeAssignment'], $statement->fetchAll());
    }

    public function findForClient(string $publicId, int $clientId, bool $lock = false): ?array
    {
        $statement = $this->database->prepare(
            'SELECT ia.*, e.public_id AS engagement_public_id, e.title AS engagement_title
             FROM intake_assignments ia INNER JOIN engagements e ON e.id = ia.engagement_id
             WHERE ia.public_id = :id AND ia.client_id = :client_id AND ia.archived_at IS NULL LIMIT 1' . ($lock ? ' FOR UPDATE' : '')
        );
        $statement->execute(['id' => $publicId, 'client_id' => $clientId]);
        $row = $statement->fetch();
        return is_array($row) ? $this->decodeAssignment($row) : null;
    }

    public function findAdmin(string $publicId): ?array
    {
        $statement = $this->database->prepare(
            'SELECT ia.*, c.public_id AS client_public_id, c.display_name AS client_name,
                    e.public_id AS engagement_public_id, e.title AS engagement_title
             FROM intake_assignments ia INNER JOIN clients c ON c.id = ia.client_id
             INNER JOIN engagements e ON e.id = ia.engagement_id WHERE ia.public_id = :id LIMIT 1'
        );
        $statement->execute(['id' => $publicId]); $row = $statement->fetch();
        return is_array($row) ? $this->decodeAssignment($row) : null;
    }

    public function listAdmin(): array
    {
        return array_map([$this, 'decodeAssignment'], $this->database->query(
            'SELECT ia.public_id AS id, ia.family_key, ia.module_keys, ia.status, ia.completion_percentage,
                    ia.due_date, ia.submitted_at, ia.blocking_reason, c.public_id AS client_id,
                    c.display_name AS client_name, e.public_id AS engagement_id, e.title AS engagement_title,
                    u.display_name AS assigned_team_member,
                    (SELECT COUNT(*) FROM intake_requirements ir WHERE ir.intake_assignment_id = ia.id AND ir.status = \'missing\') AS missing_requirements
             FROM intake_assignments ia INNER JOIN clients c ON c.id = ia.client_id
             INNER JOIN engagements e ON e.id = ia.engagement_id LEFT JOIN users u ON u.id = ia.assigned_to_user_id
             WHERE ia.archived_at IS NULL ORDER BY ia.created_at DESC'
        )->fetchAll());
    }

    public function responses(int $assignmentId, int $clientId): array
    {
        $statement = $this->database->prepare('SELECT section_key, field_key, response_value, applicability, updated_at FROM intake_responses WHERE intake_assignment_id = :assignment AND client_id = :client');
        $statement->execute(['assignment' => $assignmentId, 'client' => $clientId]);
        $result = [];
        foreach ($statement->fetchAll() as $row) $result[$row['field_key']] = ['value' => json_decode((string) $row['response_value'], true), 'section' => $row['section_key'], 'applicability' => $row['applicability'], 'updated_at' => $row['updated_at']];
        return $result;
    }

    public function requirements(int $assignmentId): array
    {
        $statement = $this->database->prepare(
            "SELECT ir.public_id AS id, ir.requirement_key, ir.requirement_name, ir.requirement_type,
                    ir.necessity, CASE WHEN d.status='received' THEN 'under_review' WHEN d.status='under_review' THEN 'under_review' WHEN d.status='accepted' THEN IF(ir.status='already_on_file','already_on_file','accepted') WHEN d.status='replacement_requested' THEN 'replacement_requested' ELSE ir.status END AS status, ir.notes, d.public_id AS document_id, d.document_name,
                    d.status AS document_status,
                    (SELECT ds.public_id FROM document_submissions ds WHERE ds.document_id=d.id AND ds.archived_at IS NULL ORDER BY ds.version_number DESC LIMIT 1) AS submission_id,
                    (SELECT ds.original_filename FROM document_submissions ds WHERE ds.document_id=d.id AND ds.archived_at IS NULL ORDER BY ds.version_number DESC LIMIT 1) AS filename,
                    (SELECT ds.submitted_at FROM document_submissions ds WHERE ds.document_id=d.id AND ds.archived_at IS NULL ORDER BY ds.version_number DESC LIMIT 1) AS uploaded_at
             FROM intake_requirements ir LEFT JOIN documents_metadata d ON d.id = ir.document_id
             WHERE ir.intake_assignment_id = :id ORDER BY ir.id"
        );
        $statement->execute(['id' => $assignmentId]); return $statement->fetchAll();
    }

    public function findRequirement(string $requirementId, string $assignmentId, int $clientId, bool $lock=false): ?array
    {
        return $this->one('SELECT ir.*, ia.public_id AS assignment_public_id, ia.family_key FROM intake_requirements ir INNER JOIN intake_assignments ia ON ia.id=ir.intake_assignment_id WHERE ir.public_id=:requirement AND ia.public_id=:assignment AND ir.client_id=:client AND ia.archived_at IS NULL LIMIT 1'.($lock?' FOR UPDATE':''), ['requirement'=>$requirementId,'assignment'=>$assignmentId,'client'=>$clientId]);
    }

    public function updateRequirement(int $id,array $values):void{$this->updateTable('intake_requirements',$id,$values);}
    public function addRequirementHistory(int $requirementId,?int $documentId,string $status,?string $note,?int $actor):void{$this->database->prepare('INSERT INTO intake_requirement_history(public_id,intake_requirement_id,document_id,status,note,actor_user_id) VALUES(:public_id,:requirement,:document,:status,:note,:actor)')->execute(['public_id'=>alchemize_uuid_v4(),'requirement'=>$requirementId,'document'=>$documentId,'status'=>$status,'note'=>$note,'actor'=>$actor]);}
    public function reviewRequirementDocument(int $documentId,string $status,int $actor,?string $clientNote,?string $internalNote):void{$this->database->prepare("UPDATE document_submissions SET status=:status,client_visible_review_note=:client_note,internal_review_notes=:internal_note,reviewed_at=CURRENT_TIMESTAMP(6),reviewed_by_user_id=:actor WHERE document_id=:document AND archived_at IS NULL AND status IN ('received','under_review') ORDER BY version_number DESC LIMIT 1")->execute(['status'=>$status,'client_note'=>$clientNote,'internal_note'=>$internalNote,'actor'=>$actor,'document'=>$documentId]);$this->updateTable('documents_metadata',$documentId,['status'=>$status,'reviewed_date'=>date('Y-m-d')]);}

    public function eligibleDocuments(int $clientId,string $requirementKey):array
    {
        $s=$this->database->prepare("SELECT d.public_id AS id,d.document_name,d.document_type,d.reviewed_date,ds.original_filename FROM documents_metadata d LEFT JOIN document_submissions ds ON ds.id=(SELECT latest.id FROM document_submissions latest WHERE latest.document_id=d.id AND latest.archived_at IS NULL ORDER BY latest.version_number DESC LIMIT 1) WHERE d.client_id=:client AND d.visibility IN ('client','shared') AND d.status='accepted' AND d.archived_at IS NULL AND d.document_type=:type ORDER BY d.reviewed_date DESC,d.id DESC");
        $s->execute(['client'=>$clientId,'type'=>$requirementKey]);return $s->fetchAll();
    }

    public function authorizedDocument(string $publicId,int $clientId,bool $acceptedOnly=true):?array
    {
        return $this->one("SELECT id,public_id,client_id,engagement_id,document_name,document_type,status,visibility FROM documents_metadata WHERE public_id=:id AND client_id=:client AND visibility IN ('client','shared') AND archived_at IS NULL".($acceptedOnly?" AND status='accepted'":'').' LIMIT 1',['id'=>$publicId,'client'=>$clientId]);
    }
    public function authorizedDocumentByInternalId(int $id,int $clientId):?array{return $this->one("SELECT id,public_id FROM documents_metadata WHERE id=:id AND client_id=:client AND visibility IN ('client','shared') AND archived_at IS NULL LIMIT 1",['id'=>$id,'client'=>$clientId]);}

    public function createRequirementDocument(array $requirement):array
    {
        $id=alchemize_uuid_v4();$s=$this->database->prepare("INSERT INTO documents_metadata(public_id,client_id,engagement_id,document_name,document_type,status,visibility,requested_date,due_date,client_instructions) SELECT :public_id,ir.client_id,ir.engagement_id,ir.requirement_name,ir.requirement_key,'awaiting_upload','shared',CURRENT_DATE,ia.due_date,CONCAT('Uploading for: ',ir.requirement_name,' — ',REPLACE(ia.family_key,'_',' ')) FROM intake_requirements ir INNER JOIN intake_assignments ia ON ia.id=ir.intake_assignment_id WHERE ir.id=:id");$s->execute(['public_id'=>$id,'id'=>$requirement['id']]);return ['id'=>(int)$this->database->lastInsertId(),'public_id'=>$id];
    }

    public function address(string $id,int $clientId):?array{return $this->one('SELECT * FROM client_addresses WHERE public_id=:id AND client_id=:client AND is_current=1 LIMIT 1',['id'=>$id,'client'=>$clientId]);}
    public function person(string $id,int $clientId):?array{return $this->one('SELECT * FROM client_business_people WHERE public_id=:id AND client_id=:client AND archived_at IS NULL LIMIT 1',['id'=>$id,'client'=>$clientId]);}
    public function createAddress(int $clientId,array $v):string{$id=alchemize_uuid_v4();$this->database->prepare('INSERT INTO client_addresses(public_id,client_id,address_type,label,line1,line2,city,state,postal_code,country,is_primary) VALUES(:id,:client,:address_type,:label,:line1,:line2,:city,:state,:postal_code,:country,:is_primary)')->execute(['id'=>$id,'client'=>$clientId,...$v]);return $id;}
    public function updateAddress(string $id,int $clientId,array $v):bool{$v['id']=$id;$v['client']=$clientId;$s=$this->database->prepare('UPDATE client_addresses SET address_type=:address_type,label=:label,line1=:line1,line2=:line2,city=:city,state=:state,postal_code=:postal_code,country=:country,is_primary=:is_primary WHERE public_id=:id AND client_id=:client AND is_current=1');$s->execute($v);return $s->rowCount()>0;}
    public function removeAddress(string $id,int $clientId):bool{$s=$this->database->prepare('UPDATE client_addresses SET is_current=0 WHERE public_id=:id AND client_id=:client AND is_current=1');$s->execute(['id'=>$id,'client'=>$clientId]);return $s->rowCount()>0;}
    public function createPerson(int $clientId,array $v):string{$id=alchemize_uuid_v4();$this->database->prepare('INSERT INTO client_business_people(public_id,client_id,name,role_type,title,email,phone,ownership_percentage,is_authorized_contact,is_decision_maker,is_primary,client_notes) VALUES(:id,:client,:name,:role_type,:title,:email,:phone,:ownership_percentage,:is_authorized_contact,:is_decision_maker,:is_primary,:client_notes)')->execute(['id'=>$id,'client'=>$clientId,...$v]);return $id;}
    public function updatePerson(string $id,int $clientId,array $v):bool{$v['id']=$id;$v['client']=$clientId;$s=$this->database->prepare('UPDATE client_business_people SET name=:name,role_type=:role_type,title=:title,email=:email,phone=:phone,ownership_percentage=:ownership_percentage,is_authorized_contact=:is_authorized_contact,is_decision_maker=:is_decision_maker,is_primary=:is_primary,client_notes=:client_notes WHERE public_id=:id AND client_id=:client AND archived_at IS NULL');$s->execute($v);return $s->rowCount()>0;}
    public function removePerson(string $id,int $clientId):bool{$s=$this->database->prepare('UPDATE client_business_people SET archived_at=CURRENT_TIMESTAMP(6) WHERE public_id=:id AND client_id=:client AND archived_at IS NULL');$s->execute(['id'=>$id,'client'=>$clientId]);return $s->rowCount()>0;}
    public function replaceProfileReferences(int $assignmentId,int $clientId,string $field,string $type,array $records):void{$this->database->prepare('DELETE FROM intake_profile_references WHERE intake_assignment_id=:assignment AND client_id=:client AND field_key=:field')->execute(['assignment'=>$assignmentId,'client'=>$clientId,'field'=>$field]);$s=$this->database->prepare('INSERT INTO intake_profile_references(public_id,intake_assignment_id,client_id,field_key,record_type,record_public_id,record_snapshot) VALUES(:id,:assignment,:client,:field,:type,:record,:snapshot)');foreach($records as $r)$s->execute(['id'=>alchemize_uuid_v4(),'assignment'=>$assignmentId,'client'=>$clientId,'field'=>$field,'type'=>$type,'record'=>$r['public_id'],'snapshot'=>json_encode($r,JSON_THROW_ON_ERROR)]);}

    public function saveResponse(array $row): void
    {
        $statement = $this->database->prepare(
            'INSERT INTO intake_responses (public_id, intake_assignment_id, client_id, section_key, field_key, response_value, applicability, answered_by_user_id)
             VALUES (:public_id,:intake_assignment_id,:client_id,:section_key,:field_key,:response_value,:applicability,:answered_by_user_id)
             ON DUPLICATE KEY UPDATE response_value=VALUES(response_value), applicability=VALUES(applicability), answered_by_user_id=VALUES(answered_by_user_id)'
        ); $statement->execute($row);
    }

    public function updateAssignment(int $id, array $values): void
    {
        $parts = array_map(static fn ($key) => "$key = :$key", array_keys($values));
        $values['id'] = $id; $this->database->prepare('UPDATE intake_assignments SET '.implode(', ', $parts).' WHERE id = :id')->execute($values);
    }

    public function engagementForAssignment(string $engagementPublicId, string $clientPublicId): ?array
    {
        $statement = $this->database->prepare('SELECT e.id, e.client_id FROM engagements e INNER JOIN clients c ON c.id=e.client_id WHERE e.public_id=:engagement AND c.public_id=:client LIMIT 1');
        $statement->execute(['engagement'=>$engagementPublicId,'client'=>$clientPublicId]); $row=$statement->fetch(); return is_array($row)?$row:null;
    }

    public function createAssignment(array $row): int
    {
        $statement=$this->database->prepare('INSERT INTO intake_assignments (public_id,client_id,engagement_id,family_key,module_keys,assigned_by_user_id,assigned_to_user_id,due_date) VALUES (:public_id,:client_id,:engagement_id,:family_key,:module_keys,:assigned_by_user_id,:assigned_to_user_id,:due_date)');
        $statement->execute($row); return (int)$this->database->lastInsertId();
    }

    public function createRequirement(array $row): void
    {
        $this->database->prepare('INSERT INTO intake_requirements (public_id,intake_assignment_id,client_id,engagement_id,requirement_key,requirement_name,requirement_type,necessity,status,document_id) VALUES (:public_id,:intake_assignment_id,:client_id,:engagement_id,:requirement_key,:requirement_name,:requirement_type,:necessity,:status,:document_id)')->execute($row);
    }

    public function reusableDocument(int $clientId, string $key, string $name): ?array
    {
        $statement=$this->database->prepare("SELECT id FROM documents_metadata WHERE client_id=:client AND archived_at IS NULL AND status='accepted' AND (document_type=:key OR LOWER(document_name)=LOWER(:name)) ORDER BY reviewed_date DESC,id DESC LIMIT 1");
        $statement->execute(['client'=>$clientId,'key'=>$key,'name'=>$name]);$row=$statement->fetch();return is_array($row)?$row:null;
    }

    public function profile(int $clientId): array
    {
        $client=$this->one('SELECT public_id AS id, client_type, display_name, legal_name, preferred_name, primary_email, primary_phone, preferred_contact_method, language_preference FROM clients WHERE id=:id',['id'=>$clientId]);
        $business=$this->one('SELECT legal_name AS legal_business_name,dba_name,entity_type,formation_state,formation_date,ein_status,industry,business_description,business_email,business_phone,website,domain_name,domain_registrar,email_provider,social_profiles FROM business_profiles WHERE client_id=:id',['id'=>$clientId]);
        $addresses=$this->all('SELECT public_id AS id,address_type,label,line1,line2,city,state,postal_code,country,is_primary FROM client_addresses WHERE client_id=:id AND is_current=1',['id'=>$clientId]);
        $people=$this->all('SELECT public_id AS id,name,role_type,title,email,phone,ownership_percentage,is_authorized_contact,is_decision_maker,is_primary,client_notes FROM client_business_people WHERE client_id=:id AND archived_at IS NULL',['id'=>$clientId]);
        if (isset($business['social_profiles'])) $business['social_profiles']=json_decode((string)$business['social_profiles'],true);
        return ['client'=>$client,'business'=>$business,'addresses'=>$addresses,'people'=>$people];
    }

    public function updateCanonicalProfile(int $clientId, array $responses): void
    {
        $clientMap=['legal_name'=>'legal_name','preferred_name'=>'preferred_name','primary_email'=>'primary_email','primary_phone'=>'primary_phone','preferred_contact_method'=>'preferred_contact_method','client_type'=>'client_type'];
        $client=[];foreach($clientMap as $field=>$column)if(array_key_exists($field,$responses))$client[$column]=$responses[$field];
        if($client!==[])$this->updateTable('clients',$clientId,$client);
        $businessFields=['legal_business_name'=>'legal_name','dba_name'=>'dba_name','entity_type'=>'entity_type','formation_state'=>'formation_state','formation_date'=>'formation_date','ein_status'=>'ein_status','industry'=>'industry','business_description'=>'business_description','business_phone'=>'business_phone','business_email'=>'business_email','website'=>'website','domain_name'=>'domain_name','domain_registrar'=>'domain_registrar','email_provider'=>'email_provider'];
        $business=[];foreach($businessFields as $field=>$column)if(array_key_exists($field,$responses))$business[$column]=$responses[$field];
        if(array_key_exists('social_profiles',$responses))$business['social_profiles']=json_encode(array_values(array_filter(array_map('trim',preg_split('/\R/',(string)$responses['social_profiles'])))),JSON_THROW_ON_ERROR);
        if($business!==[]){$existing=$this->one('SELECT id FROM business_profiles WHERE client_id=:id',['id'=>$clientId]);if($existing)$this->updateTable('business_profiles',(int)$existing['id'],$business);else{$business['public_id']=alchemize_uuid_v4();$business['client_id']=$clientId;$business['legal_name']=$business['legal_name']??'Business profile';$columns=array_keys($business);$this->database->prepare('INSERT INTO business_profiles('.implode(',',$columns).') VALUES(:'.implode(',:',$columns).')')->execute($business);}}
    }

    private function decodeAssignment(array $row): array { if(isset($row['module_keys']))$row['module_keys']=json_decode((string)$row['module_keys'],true)?:[]; return $row; }
    private function updateTable(string $table,int $id,array $values):void{$parts=array_map(static fn($key)=>"$key=:$key",array_keys($values));$values['id']=$id;$this->database->prepare("UPDATE $table SET ".implode(',',$parts).' WHERE id=:id')->execute($values);}
    private function one(string $sql,array $params):?array{$s=$this->database->prepare($sql);$s->execute($params);$r=$s->fetch();return is_array($r)?$r:null;}
    private function all(string $sql,array $params):array{$s=$this->database->prepare($sql);$s->execute($params);return $s->fetchAll();}
}
