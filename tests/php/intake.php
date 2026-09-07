<?php
// In-memory PDO boundary: exercises the real repository and service without a production database.
require_once __DIR__.'/../../server/http/request.php';
require_once __DIR__.'/../../server/intake/definitions.php';
require_once __DIR__.'/../../server/repositories/intake-repository.php';
require_once __DIR__.'/../../server/repositories/activity-repository.php';
require_once __DIR__.'/../../server/services/intake-service.php';
function alchemize_uuid_v4():string { return 'test-uuid'; }
function expectIntake(bool $ok,string $message):void { if(!$ok)throw new RuntimeException($message); }
final class IntakeTestPDO extends PDO {
    public array $assignment=['id'=>1,'public_id'=>'intake','client_id'=>7,'engagement_id'=>2,'engagement_title'=>'Business Consulting','family_key'=>'web_digital','module_keys'=>'["integrations"]','status'=>'in_progress','intake_service_codes'=>'website-design'];
    public array $responses=[]; public array $requirements=[]; public array $events=[];
    public function __construct() {}
    public function prepare(string $query,array $options=[]):PDOStatement|false {return new IntakeTestStatement($this,$query);}
}
final class IntakeTestStatement extends PDOStatement {
    private array $rows=[];
    public function __construct(private IntakeTestPDO $db,private string $sql){}
    public function execute(?array $params=null):bool {
        $this->rows=[];$q=$this->sql;
        if(str_starts_with($q,'SELECT ia.')) $this->rows=[$this->db->assignment];
        elseif(str_contains($q,'FROM intake_profile_references')) $this->rows=[];
        elseif(str_contains($q,'FROM intake_responses')) $this->rows=array_values($this->db->responses);
        elseif(str_contains($q,'FROM intake_requirements ir')) $this->rows=$this->db->requirements;
        elseif(str_starts_with($q,'INSERT INTO intake_responses')) $this->db->responses[$params['field_key']]=['section_key'=>$params['section_key'],'field_key'=>$params['field_key'],'response_value'=>$params['response_value'],'applicability'=>$params['applicability'],'updated_at'=>'now'];
        elseif(str_starts_with($q,'UPDATE intake_assignments')) $this->db->assignment=array_replace($this->db->assignment,$params);
        elseif(str_starts_with($q,'INSERT INTO activity_events')) $this->db->events[]=$params;
        elseif(str_contains($q,'FROM clients')||str_contains($q,'FROM business_profiles')) $this->rows=[[]];
        elseif(str_contains($q,'FROM client_addresses')||str_contains($q,'FROM client_business_people')) $this->rows=[];
        else throw new RuntimeException('Unexpected query: '.$q);
        return true;
    }
    public function fetch(int $mode=PDO::FETCH_DEFAULT,int $cursorOrientation=PDO::FETCH_ORI_NEXT,int $cursorOffset=0):mixed{return array_shift($this->rows)??false;}
    public function fetchAll(int $mode=PDO::FETCH_DEFAULT,mixed ...$args):array{return $this->rows;}
}
$db=new IntakeTestPDO();$repo=new AlchemizeIntakeRepository($db);$service=new AlchemizeIntakeService($repo,new AlchemizeActivityRepository($db));$access=['client_id'=>7];$user=['user_id'=>8];
$service->save($access,$user,'intake',['responses'=>['integrations'=>['value'=>['crm']]]]);
try {$service->submit($access,$user,'intake');throw new RuntimeException('Missing required integration details accepted');}catch(AlchemizeRequestException $e){}
expectIntake($db->events===[],'Invalid submission emitted activity');
$service->save($access,$user,'intake',['responses'=>['integration_notes'=>['value'=>'Customer record sync']]]);
expectIntake($db->assignment['completion_percentage']===100,'Section did not complete');
$service->save($access,$user,'intake',['responses'=>['integrations'=>['value'=>[]]]]);
expectIntake(isset($db->responses['integration_notes']),'Hidden child draft lost');
$result=$service->submit($access,$user,'intake');
expectIntake($result['status']==='submitted'&&count($db->events)===1,'Submission activity failed');
$db->assignment['status']='in_progress';$db->assignment['module_keys']='["branding"]';$db->requirements=[['id'=>'logo','requirement_key'=>'logo','necessity'=>'required','status'=>'missing']];
$service->save($access,$user,'intake',['responses'=>['logo_available'=>['value'=>'no']]]);
expectIntake($db->assignment['completion_percentage']===100,'Nonexistent logo blocks submission');
$service->save($access,$user,'intake',['responses'=>['logo_available'=>['value'=>'yes']]]);
expectIntake($db->assignment['completion_percentage']===50,'Applicable logo is not required');
$db->requirements[0]['status']='under_review';$service->submit($access,$user,'intake');
expectIntake($db->assignment['status']==='submitted','Uploaded document blocks submission');
$db->assignment['status']='in_progress';$db->assignment['intake_service_codes']='business-consulting';
$resolved=$repo->findForClient('intake',7);
expectIntake($resolved['family_key']==='business_consulting','Consulting draft mapping wrong');
expectIntake(in_array('business_context',$resolved['module_keys'],true),'Consulting context missing');
$service->save($access,$user,'intake',['responses'=>['current_situation'=>['value'=>'Operating business']]]);
expectIntake($db->assignment['family_key']==='business_consulting','Correction not persisted on save');
expectIntake(isset($db->responses['integration_notes']),'Mapping correction erased saved history');
$db->assignment['family_key']='web_digital';$db->assignment['status']='submitted';
expectIntake($repo->findForClient('intake',7)['family_key']==='web_digital','Historical submission rewritten');
echo "Intake repository/service: mapping, drafts, conditional documents, rejection and submission passed.\n";

foreach(['submitted','under_review','waiting_on_alchemize','approved','completed','archived'] as $lockedStatus) {
    $db->assignment['status']=$lockedStatus;$before=$db->responses;$events=$db->events;
    foreach(['save','submit'] as $operation) {
        $rejected=false;
        try { if($operation==='save')$service->save($access,$user,'intake',['responses'=>['integration_notes'=>['value'=>'Changed']]]);else $service->submit($access,$user,'intake'); }
        catch(AlchemizeRequestException $e){$rejected=true;}
        expectIntake($rejected,'Locked intake allowed '.$operation.' for '.$lockedStatus);
    }
    expectIntake($before===$db->responses && $events===$db->events,'Locked intake history changed');
}
$db->assignment['status']='changes_requested';
$service->save($access,$user,'intake',['responses'=>['current_situation'=>['value'=>'Reopened answer']]]);
expectIntake(isset($db->responses['current_situation']),'Reopened intake could not save');
