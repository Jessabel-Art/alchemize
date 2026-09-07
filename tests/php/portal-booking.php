<?php
require_once __DIR__.'/../../server/http/request.php';
require_once __DIR__.'/../../server/repositories/appointment-repository.php';
require_once __DIR__.'/../../server/services/appointment-scheduling-service.php';
require_once __DIR__.'/../../server/services/portal-booking-service.php';
function alchemize_uuid_v4():string {return 'test-event';}
function verifyBooking(bool $condition,string $message):void {if(!$condition)throw new RuntimeException($message);}
function rejectsBooking(callable $operation,string $code):void {try{$operation();}catch(AlchemizeRequestException $error){verifyBooking($error->errorCode===$code,'Unexpected error: '.$error->errorCode);return;}throw new RuntimeException('Expected '.$code);}
final class AlchemizeExternalIntegrationService {
    public array $busy=[];public bool $fail=false;public bool $busyFails=false;public int $syncs=0;
    public function appointmentBusyPeriods(string $date,string $timezone,bool $strict=false):array {verifyBooking($strict,'Availability must fail closed');if($this->busyFails)throw new AlchemizeRequestException(503,'CALENDAR_UNAVAILABLE','Unavailable');return $this->busy;}
    public function synchronizeAppointment(int $id):array {$this->syncs++;return ['status'=>$this->fail ? 'failed' : 'synchronized'];}
}
final class AlchemizeNotificationService {
    public array $sent=[];
    public function notifyClient(int $client,string $event,string $kind,string $id,string $title,string $body,string $key):string {$this->sent[$key]=[$client,$id];return 'sent';}
}
final class BookingPDO extends PDO {
    public array $appointments=[];public array $availability=[];public array $events=[];public bool $transaction=false;public bool $locked=false;public int $checks=0;public bool $race=false;
    public function __construct(){}
    public function prepare(string $query,array $options=[]):PDOStatement|false {return new BookingStatement($this,$query);}
    public function query(string $query,?int $fetchMode=null,mixed ...$args):PDOStatement|false {$s=new BookingStatement($this,$query);$s->execute();return $s;}
    public function lastInsertId(?string $name=null):string|false {return (string)count($this->appointments);}
    public function beginTransaction():bool {$this->transaction=true;return true;}
    public function commit():bool {$this->transaction=false;return true;}
    public function rollBack():bool {$this->transaction=false;return true;}
    public function inTransaction():bool {return $this->transaction;}
}
final class BookingStatement extends PDOStatement {
    private array $rows=[];
    public function __construct(private BookingPDO $db,private string $sql){}
    public function execute(?array $params=null):bool {
        $q=$this->sql;$p=$params ?? [];$this->rows=[];
        if(str_contains($q,'GET_LOCK')){$this->db->locked=true;$this->rows=[[1]];}
        elseif(str_contains($q,'RELEASE_LOCK')){$this->db->locked=false;$this->rows=[[1]];}
        elseif(str_contains($q,'FROM engagements')){$this->rows=($p['client']===7 && (!isset($p['id']) || $p['id']==='eng-own')) ? (isset($p['id']) ? [['id'=>12]] : [['id'=>'eng-own','title'=>'Consulting']]) : [];}
        elseif(str_contains($q,'FROM appointment_availability'))$this->rows=$this->db->availability;
        elseif(str_contains($q,'FROM appointments') && str_contains($q,'scheduled_at <')) {
            $this->db->checks++;
            foreach($this->db->appointments as $row)if($row['status']!=='cancelled' && $row['id']!==($p['exclude_id'] ?? 0) && $row['scheduled_at']<$p['end_at'] && $row['end_at']>$p['start_at'])$this->rows[]=$row;
            if($this->db->race && $this->db->transaction)$this->rows[]=['id'=>99];
        }
        elseif(str_contains($q,'SELECT * FROM appointments')) {foreach($this->db->appointments as $row)if($row['public_id']===$p['id'] && $row['client_id']===$p['client'])$this->rows[]=$row;}
        elseif(str_starts_with($q,'INSERT INTO appointments')) {verifyBooking($this->db->locked,'Create without shared lock');$id=count($this->db->appointments)+1;$this->db->appointments[$id]=['id'=>$id]+$p;}
        elseif(str_starts_with($q,'UPDATE appointments')) {$id=$p['id'];unset($p['id']);$this->db->appointments[$id]=array_replace($this->db->appointments[$id],$p);}
        elseif(str_contains($q,'INSERT INTO activity_events') || str_contains($q,'INSERT INTO audit_events'))$this->db->events[]=$p;
        else throw new RuntimeException('Unexpected SQL: '.$q);
        return true;
    }
    public function fetch(int $mode=PDO::FETCH_DEFAULT,int $cursorOrientation=PDO::FETCH_ORI_NEXT,int $cursorOffset=0):mixed {return array_shift($this->rows) ?? false;}
    public function fetchAll(int $mode=PDO::FETCH_DEFAULT,mixed ...$args):array {return $this->rows;}
    public function fetchColumn(int $column=0):mixed {return $this->rows ? array_values($this->rows[0])[$column] : false;}
}
$db=new BookingPDO();$repo=new AlchemizeAppointmentRepository($db);$scheduler=new AlchemizeAppointmentSchedulingService($repo);$integration=new AlchemizeExternalIntegrationService();$notifications=new AlchemizeNotificationService();
$service=new AlchemizePortalBookingService($db,$repo,$scheduler,$integration,$notifications,['timezone'=>'America/New_York','appointment_default_duration'=>75,'default_meeting_method'=>'video_call'],true);
$access=['client_id'=>7,'access_role'=>'primary_contact'];
$context=$service->context($access);verifyBooking(count($context['services'])===1 && $context['types'][0]['duration_minutes']===30 && $context['types'][3]['duration_minutes']===75,'Service/type/default duration failed');
$payload=['type'=>'follow_up','engagement_id'=>'eng-own','meeting_method'=>'google_meet','date'=>'2030-09-09','selected_start'=>'2030-09-09T09:00:00-04:00','booking_key'=>'client-booking-key-0001'];
rejectsBooking(fn()=>$service->availability($access,array_replace($payload,['engagement_id'=>'eng-other'])),'NOT_FOUND');
rejectsBooking(fn()=>$service->book(['client_id'=>7,'access_role'=>'read_only'],$payload),'PORTAL_ACTION_NOT_PERMITTED');
$db->availability=[['kind'=>'date_override','is_available'=>0]];
verifyBooking($service->availability($access,$payload)['slots']===[],'Closed date override reopened');
$db->availability=[['kind'=>'weekday','is_available'=>0]];
verifyBooking($service->availability($access,$payload)['slots']===[],'Closed weekly hours reopened');
$db->availability=[];
$integration->busy=[['start'=>'2030-09-09T09:00:00-04:00','end'=>'2030-09-09T10:00:00-04:00']];
verifyBooking($service->availability($access,$payload)['slots'][0]['label']==='10:00 AM','Google busy period ignored');
$integration->busy=[];$db->race=true;
rejectsBooking(fn()=>$service->book($access,$payload),'SLOT_UNAVAILABLE');verifyBooking($db->appointments===[],'Race created appointment');$db->race=false;
$result=$service->book($access,$payload);
verifyBooking($result['status']==='confirmed' && count($db->appointments)===1 && $db->appointments[1]['engagement_id']===12 && $db->appointments[1]['duration_minutes']===30,'Booking/engagement/duration failed');
$service->book($access,$payload);verifyBooking(count($db->appointments)===1 && count($notifications->sent)===1,'Duplicate booking or notification');
verifyBooking($service->availability($access,$payload)['slots'][0]['label']==='9:30 AM','Occupied slot offered');
rejectsBooking(fn()=>$service->book($access,array_replace($payload,['booking_key'=>'client-booking-key-0002'])),'SLOT_UNAVAILABLE');
rejectsBooking(fn()=>$service->rescheduleAvailability(['client_id'=>8,'access_role'=>'primary_contact'],$result['id'],'2030-09-10'),'NOT_FOUND');
verifyBooking($service->validateReschedule($access,$result['id'],'2030-09-10T10:00:00-04:00')==='2030-09-10 10:00:00','Reschedule availability failed');
$integration->busyFails=true;rejectsBooking(fn()=>$service->availability($access,$payload),'CALENDAR_UNAVAILABLE');$integration->busyFails=false;
$integration->fail=true;$second=array_replace($payload,['selected_start'=>'2030-09-09T11:00:00-04:00','booking_key'=>'client-booking-key-0003']);
rejectsBooking(fn()=>$service->book($access,$second),'CALENDAR_UNAVAILABLE');verifyBooking($db->appointments[2]['status']==='requested','Failed calendar falsely confirmed');
$integration->fail=false;$service->book($access,$second);verifyBooking(count($db->appointments)===2 && $db->appointments[2]['status']==='confirmed','Calendar retry created duplicate');
echo "Portal booking: ownership, config, hours, busy periods, server race, idempotency, calendar failure/retry, notifications and rescheduling passed.\n";
