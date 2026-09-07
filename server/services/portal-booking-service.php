<?php

declare(strict_types=1);

final class AlchemizePortalBookingService
{
    public function __construct(
        private readonly PDO $database,
        private readonly AlchemizeAppointmentRepository $repository,
        private readonly AlchemizeAppointmentSchedulingService $scheduler,
        private readonly AlchemizeExternalIntegrationService $integrations,
        private readonly AlchemizeNotificationService $notifications,
        private readonly array $settings,
        private readonly bool $calendarConfigured,
    ) {}

    public function context(array $access): array
    {
        $services = $this->database->prepare("SELECT public_id AS id, title FROM engagements WHERE client_id=:client AND archived_at IS NULL AND status NOT IN ('completed','archived') ORDER BY title");
        $services->execute(['client'=>(int)$access['client_id']]);
        $methods = [['key'=>'phone','label'=>'Phone']];
        if ($this->calendarConfigured) $methods[]=['key'=>'google_meet','label'=>'Virtual (Google Meet)'];
        return [
            'services'=>$services->fetchAll(),
            'types'=>[
                ['key'=>'follow_up','label'=>'Follow-up appointment','duration_minutes'=>30],
                ['key'=>'service_review','label'=>'Service review','duration_minutes'=>30],
                ['key'=>'document_review','label'=>'Document / information review','duration_minutes'=>30],
                ['key'=>'consultation','label'=>'General consultation','duration_minutes'=>(int)$this->settings['appointment_default_duration']],
            ],
            'methods'=>$methods,
            'default_method'=>$this->calendarConfigured && ($this->settings['default_meeting_method'] ?? '') === 'video_call' ? 'google_meet' : 'phone',
            'timezone'=>$this->settings['timezone'],
            'change_policy'=>'request',
            'can_book'=>in_array($access['access_role'],['primary_contact','authorized_user'],true),
        ];
    }

    private function selection(array $access, array $payload): array
    {
        $context=$this->context($access);
        if (!$context['can_book']) throw new AlchemizeRequestException(403,'PORTAL_ACTION_NOT_PERMITTED','This portal account cannot book appointments.');
        $type=null;
        foreach($context['types'] as $candidate) if($candidate['key']===($payload['type'] ?? '')) $type=$candidate;
        if ($type===null) throw new AlchemizeRequestException(422,'VALIDATION_ERROR','Choose an appointment type.');
        $method=(string)($payload['meeting_method'] ?? $context['default_method']);
        if (!in_array($method,array_column($context['methods'],'key'),true)) throw new AlchemizeRequestException(422,'VALIDATION_ERROR','Choose a supported meeting method.');
        $engagement=null;
        if (!empty($payload['engagement_id'])) {
            $query=$this->database->prepare("SELECT id FROM engagements WHERE public_id=:id AND client_id=:client AND archived_at IS NULL AND status NOT IN ('completed','archived') LIMIT 1");
            $query->execute(['id'=>(string)$payload['engagement_id'],'client'=>(int)$access['client_id']]);
            $engagement=$query->fetchColumn();
            if ($engagement===false) throw new AlchemizeRequestException(404,'NOT_FOUND','The related active service was not found.');
        }
        return ['appointment_type'=>$type['label'],'duration_minutes'=>$type['duration_minutes'],'timezone'=>$context['timezone'],'meeting_method'=>$method,'engagement_id'=>$engagement===null ? null : (int)$engagement];
    }

    public function availability(array $access, array $payload): array
    {
        $selection=$this->selection($access,$payload);
        return $this->slots($selection,(string)($payload['date'] ?? ''));
    }

    private function slots(array $selection,string $date): array
    {
        // Validate the date before contacting the calendar provider.
        $this->scheduler->slots($selection,$date);
        $busy=$this->integrations->appointmentBusyPeriods($date,$selection['timezone'],true);
        return ['timezone'=>$selection['timezone'],'slots'=>$this->scheduler->slots($selection,$date,$busy)];
    }

    public function rescheduleAvailability(array $access,string $id,string $date): array
    {
        $appointment=$this->ownFutureAppointment($access,$id);
        return $this->slots($appointment,$date);
    }

    public function validateReschedule(array $access,string $id,string $start): string
    {
        $appointment=$this->ownFutureAppointment($access,$id);
        $zone=new DateTimeZone($appointment['timezone']);
        try {$date=(new DateTimeImmutable($start,$zone))->setTimezone($zone)->format('Y-m-d');}
        catch(Throwable){throw new AlchemizeRequestException(422,'VALIDATION_ERROR','Choose an available time.');}
        $busy=$this->integrations->appointmentBusyPeriods($date,$appointment['timezone'],true);
        $slot=$this->scheduler->requireAvailable($appointment,$start,$busy);
        return (new DateTimeImmutable($slot['start']))->format('Y-m-d H:i:s');
    }

    private function ownFutureAppointment(array $access,string $id): array
    {
        $query=$this->database->prepare("SELECT * FROM appointments WHERE public_id=:id AND client_id=:client AND visibility IN ('client','both') LIMIT 1");
        $query->execute(['id'=>$id,'client'=>(int)$access['client_id']]);$appointment=$query->fetch();
        if (!$appointment) throw new AlchemizeRequestException(404,'NOT_FOUND','Appointment was not found.');
        if (in_array($appointment['status'],['completed','cancelled','no_show'],true) || new DateTimeImmutable($appointment['scheduled_at'],new DateTimeZone($appointment['timezone'])) <= new DateTimeImmutable()) throw new AlchemizeRequestException(409,'APPOINTMENT_STATE_INVALID','Only future appointments can be changed.');
        return $appointment;
    }

    public function book(array $access,array $payload): array
    {
        $selection=$this->selection($access,$payload);
        $key=(string)($payload['booking_key'] ?? '');
        if (!preg_match('/^[a-zA-Z0-9-]{16,80}$/',$key)) throw new AlchemizeRequestException(422,'VALIDATION_ERROR','Refresh the booking form and try again.');
        $note=trim((string)($payload['note'] ?? ''));
        if(strlen($note)>2000) throw new AlchemizeRequestException(422,'VALIDATION_ERROR','Keep your note under 2000 characters.');
        $hash=hash('sha256',$access['client_id'].':'.$key);
        $publicId=substr($hash,0,8).'-'.substr($hash,8,4).'-4'.substr($hash,13,3).'-a'.substr($hash,17,3).'-'.substr($hash,20,12);
        $fingerprint=hash('sha256',json_encode([$selection,(string)($payload['selected_start'] ?? ''),$note],JSON_THROW_ON_ERROR));
        $this->repository->acquireBookingLock();
        $appointment=$this->repository->findClientBooking($publicId,(int)$access['client_id']);
        if ($appointment!==null && (json_decode($appointment['scheduling_context'] ?? '{}',true)['fingerprint'] ?? '')!==$fingerprint) throw new AlchemizeRequestException(409,'BOOKING_KEY_REUSED','This booking has already been submitted. Refresh to start another booking.');
        if ($appointment===null) {
            $start=(string)($payload['selected_start'] ?? '');
            if ($start==='') throw new AlchemizeRequestException(422,'VALIDATION_ERROR','Select an available appointment time.');
            $slot=$this->scheduler->requireAvailable($selection,$start);
            $busy=$this->integrations->appointmentBusyPeriods(substr($slot['start'],0,10),$selection['timezone'],true);
            $this->database->beginTransaction();
            try {
                $slot=$this->scheduler->requireAvailable($selection,$start,$busy);
                $appointment=$selection+['public_id'=>$publicId,'client_id'=>(int)$access['client_id'],'scheduled_at'=>(new DateTimeImmutable($slot['start']))->format('Y-m-d H:i:s'),'end_at'=>(new DateTimeImmutable($slot['end']))->format('Y-m-d H:i:s'),'location_type'=>$selection['meeting_method'],'status'=>'confirmed','visibility'=>'both','client_instructions'=>$note ?: null,'source'=>'client_portal_booking','scheduling_context'=>json_encode(['fingerprint'=>$fingerprint],JSON_THROW_ON_ERROR)];
                $id=$this->repository->create($appointment);
                $appointment['id']=$id;
                $this->repository->recordAppointmentEvents($id,$appointment,'client.appointment.created','Client created an appointment booking.');
                $this->database->commit();
            } catch(Throwable $error) {if($this->database->inTransaction())$this->database->rollBack();throw $error;}
        }
        $id=(int)$appointment['id'];
        // Retry the same record after an uncertain provider response; never create a second booking.
        if (!in_array($appointment['status'],['requested','confirmed'],true)) return ['id'=>$publicId,'status'=>$appointment['status']];
        $this->repository->update($id,['status'=>'confirmed']);
        $sync=$this->integrations->synchronizeAppointment($id);
        if ($this->calendarConfigured && $sync['status']!=='synchronized') {
            $this->repository->update($id,['status'=>'requested']);
            throw new AlchemizeRequestException(503,'CALENDAR_UNAVAILABLE','Your time is held, but calendar confirmation failed. Retry this booking to confirm it or contact Alchemize through Messages.');
        }
        $this->notifications->notifyClient((int)$access['client_id'],'client.appointment.booked','appointment',$publicId,'Appointment confirmed',sprintf('%s is confirmed for %s (%s, %d minutes).',$appointment['appointment_type'],$appointment['scheduled_at'],$appointment['timezone'],$appointment['duration_minutes']),'portal-booking:'.$publicId);
        return ['id'=>$publicId,'status'=>'confirmed','calendar_sync'=>$sync['status']];
    }
}
