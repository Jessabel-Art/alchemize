<?php

declare(strict_types=1);

function alchemize_intake_definitions(): array
{
    $field = static fn (string $key, string $label, string $type = 'text', bool $required = false, array $extra = []): array => [
        'key' => $key, 'label' => $label, 'type' => $type, 'required' => $required, ...$extra,
    ];
    $module = static fn (string $key, string $title, array $fields, array $requirements = [], array $extra = []): array => [
        'key' => $key, 'title' => $title, 'fields' => $fields, 'requirements' => $requirements, ...$extra,
    ];
    $options = static fn (array $values): array => array_map(static fn (string $value): array => ['value' => $value, 'label' => ucwords(str_replace('_', ' ', $value))], $values);

    $definitions = [
        'client_profile' => ['label' => 'Client Profile', 'modules' => [
            $module('contact', 'Personal and contact information', [
                $field('legal_name', 'What is your full legal name?', 'text', true), $field('preferred_name', 'What name would you like us to use?'),
                $field('primary_email', 'What is your primary email address?', 'email', true), $field('primary_phone', 'What is your primary phone number?', 'tel', true),
                $field('preferred_contact_method', 'How do you prefer we contact you?', 'select', true, ['options' => $options(['email','phone','either'])]),
                $field('client_type', 'Are you engaging with us as an individual, a business, or both?', 'select', true, ['options' => $options(['individual','business','both'])]),
            ]),
            $module('business', 'Business information', [
                $field('legal_business_name', "What is your business's legal name?"), $field('dba_name', 'Does your business operate under a different (DBA / trade) name?'),
                $field('entity_type', 'What type of business entity is this?'), $field('formation_state', 'In which state was the business formed?'),
                $field('formation_date', 'When was the business formed?', 'date'), $field('ein_status', 'What is the status of your EIN?', 'select', false, ['options' => $options(['unknown','not_requested','requested','issued'])]),
                $field('industry', 'What industry is the business in?'), $field('business_description', 'How would you describe the business?', 'textarea'),
                $field('business_phone', "What is the business's phone number?", 'tel'), $field('business_email', "What is the business's email address?", 'email'), $field('website', "What is the business's website address?", 'url'),
            ]),
            $module('digital_presence', 'Digital presence', [
                $field('domain_name', 'What is your domain name?'), $field('domain_registrar', 'Where is your domain registered?'),
                $field('email_provider', 'Who provides your business email?'), $field('social_profiles', 'What social media or profile URLs should we know about?', 'textarea'),
            ]),
            $module('people', 'Owners & key contacts', [
                $field('business_people', 'Who are the people connected to your business?', 'people', false, ['helper' => 'Add the people involved in ownership, business decisions, or this service. Include ownership percentage only if it has already been determined.']),
            ], [], ['intro' => 'Keep reusable contact and ownership information together so it can support future services.']),
            $module('addresses', 'Addresses', [$field('addresses', 'What are your principal, business, and mailing addresses?', 'address_refs')]),
        ]],
        'web_digital' => ['label' => 'Web & Digital Solutions', 'modules' => [
            $module('project_overview', 'Project overview', [
                $field('project_type', 'What type of website project are you looking for?', 'multiselect', true, ['options' => $options(['new_website','website_redesign','web_presence','domain_setup','dns_configuration','business_email','hosting_deployment','seo','analytics','integrations','website_maintenance','other'])]),
                $field('project_goals', 'What are the primary goals for this project?', 'textarea', true), $field('primary_outcome', 'What is the primary outcome you want this website to achieve?', 'textarea', true),
                $field('target_audience', 'Who is the target audience for this website?', 'textarea'), $field('project_contacts', 'Who are the primary project contacts or decision makers?', 'person_refs'), $field('desired_launch_date', 'When would you like this project to launch?', 'date'), $field('known_deadlines', 'Are there any known deadlines we should be aware of?', 'textarea'),
                $field('profile_business_confirmed', 'Is the business in your Client Profile the business this project is for?', 'select', true, ['options' => $options(['yes','no'])]),
                $field('alternate_business', 'Which business is this project for?', 'text', true, ['helper' => 'This project is for a different business than the one saved in your profile, so we need a few additional details.', 'show_when' => ['field' => 'profile_business_confirmed', 'equals' => 'no']]),
            ], [], ['intro' => 'Start with what you want the digital presence to accomplish and who it needs to serve.']),
            $module('website_requirements', 'Website requirements', [
                $field('site_mode', 'Is this a new website or a redesign of an existing site?', 'select', true, ['options' => $options(['new_site','redesign'])]),
                $field('existing_site_url', 'What is the URL of your existing site?', 'url', true, ['show_when' => ['field' => 'site_mode', 'equals' => 'redesign']]),
                $field('required_pages', 'What pages does the website need to include?', 'textarea'), $field('functionality', 'What functionality does the website need?', 'multiselect', false, ['options' => $options(['contact_forms','ecommerce','booking','client_portal','payment_processing','crm','other_integrations'])]),
                $field('calls_to_action', 'What should visitors be able to do on the website (primary calls to action)?', 'textarea'),
            ], [], ['intro' => 'Tell us what the website needs to include and what visitors should be able to do.']),
            $module('ui_ux', 'UI / UX direction', [
                $field('visual_direction', 'What visual direction do you have in mind?', 'textarea'), $field('brand_personality', "How would you describe your brand's personality?", 'textarea'),
                $field('liked_sites', 'Are there websites you like? Share them and tell us why.', 'textarea'), $field('disliked_sites', 'Are there websites you dislike? Share them and tell us why.', 'textarea'),
                $field('navigation_needs', 'What navigation needs does the site have?', 'textarea'), $field('accessibility_considerations', 'Are there any accessibility considerations we should plan for?', 'textarea'), $field('key_visitor_actions', 'What are the key actions you want visitors to take?', 'textarea'),
            ], [], ['intro' => 'Help us understand how you want the site to feel and what visitors should be able to accomplish.']),
            $module('branding', 'Branding assets', [
                $field('logo_available', 'Do you already have a logo?', 'select', true, ['options' => $options(['yes','no'])]),
                $field('logo_formats', 'What logo file formats are available?', 'text', false, ['show_when' => ['field' => 'logo_available', 'equals' => 'yes']]),
                $field('brand_colors', 'What are your brand colors?'), $field('typography', 'What typography or fonts do you use?'), $field('brand_guidelines', 'Do you have brand guidelines available?', 'select', false, ['options' => $options(['yes','no'])]),
                $field('visual_assets', 'What photography, illustrations, icons, or other visual assets do you have?', 'textarea'),
            ], [['key'=>'logo','name'=>'Logo files','type'=>'asset','necessity'=>'optional'],['key'=>'brand_guidelines','name'=>'Brand guidelines','type'=>'document','necessity'=>'optional'],['key'=>'photography','name'=>'Photography / visual assets','type'=>'asset','necessity'=>'optional']], ['intro' => 'Share the visual assets you already have. If something is missing, that is okay—tell us where things stand.']),
            $module('content', 'Content', [
                $field('existing_copy', 'Do you already have copy (written content) for the site?', 'select', true, ['options' => $options(['yes','no','partial'])]),
                $field('copywriting_help', 'Do you need help with copywriting?', 'select', true, ['options' => $options(['yes','no','unsure'])]),
                $field('content_owner', 'Who will provide the content?'), $field('legal_content', 'What legal, disclaimer, policy, or compliance pages are required?', 'textarea'),
            ], [['key'=>'existing_copy','name'=>'Existing website copy','type'=>'asset','necessity'=>'optional']], ['intro' => 'Let us know what content already exists and what still needs to be created.']),
            $module('domain_dns', 'Domain and DNS', [
                $field('owns_domain', 'Do you currently own the domain you intend to use?', 'select', true, ['options' => $options(['yes','no'])]),
                $field('domain_name', 'What is your domain name?', 'text', true, ['helper' => 'Since you already own the domain, we only need enough information to understand how it is currently managed.', 'show_when' => ['field' => 'owns_domain', 'equals' => 'yes']]),
                $field('registrar', 'Who is your domain registered with?', 'text', false, ['show_when' => ['field' => 'owns_domain', 'equals' => 'yes']]),
                $field('dns_access_needed', 'Will Alchemize need delegated DNS access?', 'select', false, ['options' => $options(['yes','no','unsure']), 'show_when' => ['field' => 'owns_domain', 'equals' => 'yes']]),
                $field('transfer_required', 'Is a transfer requested?', 'select', false, ['options' => $options(['yes','no','unsure']), 'show_when' => ['field' => 'owns_domain', 'equals' => 'yes']]),
                $field('preferred_domain', 'What domain would you like to use?', 'text', true, ['helper' => 'We can help with registration and setup. Tell us what you have in mind.', 'show_when' => ['field' => 'owns_domain', 'equals' => 'no']]),
                $field('alternate_domains', 'What alternative domain options would you consider?', 'textarea', false, ['show_when' => ['field' => 'owns_domain', 'equals' => 'no']]),
                $field('registration_help', 'Would you like registration assistance?', 'select', true, ['options' => $options(['yes','no']), 'show_when' => ['field' => 'owns_domain', 'equals' => 'no']]),
                $field('domain_notes', 'Are there any existing DNS or hosting notes we should know about?', 'textarea'),
            ], [['key'=>'domain_access','name'=>'Delegated domain/DNS access','type'=>'access','necessity'=>'optional']], ['intro' => 'Tell us where things currently stand with your domain. We will only ask the questions that apply to your setup. DNS is the connection that directs your domain to services such as your website and business email.']),
            $module('business_email', 'Professional business email', [
                $field('professional_email_exists', 'Do you have professional business email?', 'select', true, ['options' => $options(['yes','no'])]),
                $field('email_provider', 'Who is your current provider?', 'text', false, ['show_when' => ['field' => 'professional_email_exists', 'equals' => 'yes']]),
                $field('email_addresses_needed', 'What email addresses do you need set up?', 'textarea'), $field('email_migration', 'Is migration required?', 'select', false, ['options' => $options(['yes','no','unsure'])]),
                $field('email_assistance', 'What assistance do you need with email?', 'textarea'),
            ], [], ['intro' => 'Tell us whether email using your business domain already exists and what support may be needed.']),
            $module('hosting', 'Hosting and deployment', [
                $field('existing_host', 'Do you have an existing host?', 'select', true, ['options' => $options(['yes','no'])]),
                $field('hosting_provider', 'Who is your hosting provider?', 'text', false, ['show_when' => ['field' => 'existing_host', 'equals' => 'yes']]),
                $field('hosting_migration', 'Is migration needed?', 'select', false, ['options' => $options(['yes','no','unsure'])]),
                $field('managed_deployment', 'Would you like Alchemize-managed deployment?', 'select', false, ['options' => $options(['yes','no','unsure'])]),
            ], [], ['intro' => 'Hosting is where the website runs. Share what is already in place, if anything.']),
            $module('seo_analytics', 'SEO and analytics', [
                $field('seo_requested', 'Would you like SEO support?', 'select', true, ['options' => $options(['yes','no'])]),
                $field('target_locations', 'What locations are you targeting?', 'textarea', false, ['show_when' => ['field' => 'seo_requested', 'equals' => 'yes']]),
                $field('target_services_keywords', 'What services or keywords are you targeting?', 'textarea', false, ['show_when' => ['field' => 'seo_requested', 'equals' => 'yes']]),
                $field('analytics_tools', 'What analytics or tracking do you already have in place?', 'multiselect', false, ['options' => $options(['google_analytics','search_console','other_tracking','none'])]),
            ], [], ['intro' => 'Tell us how people should find the business and what website activity is already being measured.']),
            $module('integrations', 'Integrations', [$field('integrations', 'What third-party integrations does the website need to connect with?', 'multiselect', false, ['options' => $options(['payment_provider','calendar','crm','forms','email_marketing','social_links','other'])]), $field('integration_notes', 'What details can you share about these integrations?', 'textarea')], [], ['intro' => 'Select the outside tools or services the website may need to connect with.']),
        ]],
        'business_formation' => ['label'=>'Business Formation & Registration','modules'=>[
            $module('business', 'Business and jurisdiction', [$field('formation_services','What services do you need?','multiselect',true,['options'=>$options(['new_formation','entity_registration','ein_assistance','licensing','permits','existing_registration'])]),$field('proposed_legal_name','What is the proposed legal name for the business?','text',true),$field('alternate_names','Are there alternate names you are considering?','textarea'),$field('business_activity','What will the business do?','textarea',true),$field('products_services','What products or services will the business offer?','textarea'),$field('jurisdiction','In which state or jurisdiction will the business be formed?','text',true),$field('operating_locations','In which counties or cities will the business operate?','textarea'),$field('expected_launch_date','When do you expect to launch the business?','date')]),
            $module('ownership','Owners & key contacts',[$field('owners','Who are the owners or members for this service?','person_refs',true,['helper'=>'Select the people already saved to your profile. Include ownership percentage only if it has already been determined.']),$field('engagement_address','What address should be used for this service?','address_refs',true),$field('management_structure','How do you expect the business to be managed?','textarea',false,['helper'=>'Share what is currently understood. You do not need to finalize an ownership or management structure through this intake.']),$field('authorized_representatives','Who are the authorized representatives for this service?','person_refs')],[],['intro'=>'Add or select the people involved in ownership, business decisions, or this service.']),
            $module('formation','Formation information',[$field('formation_status','Is this a new or existing business?','select',true,['options'=>$options(['new','existing'])]),$field('preferred_entity_type','If you already have a business structure in mind, what are you considering?','text',false,['helper'=>'If you are unsure, leave this open for discussion. This intake does not make a legal or entity-selection determination.']),$field('registered_agent_status','Do you already have a registered agent arrangement?','select',false,['options'=>$options(['yes','no','unsure'])]),$field('existing_formation_date','When was the business formed?','date',false,['show_when'=>['field'=>'formation_status','equals'=>'existing']]),$field('existing_ein','Does the business already have an EIN?','select',true,['options'=>$options(['yes','no','unknown'])])],[],['intro'=>'Provide what you already know. Alchemize will review this information with you; the form does not provide legal advice or select an entity type.']),
            $module('licensing','Licensing and permits',[$field('licensing_needed','Do you believe the business may require professional, industry, state, county, or local licensing?','select',true,['options'=>$options(['yes','no','unsure']),'helper'=>'This helps identify what may need further review. It is not a licensing determination.']),$field('license_industry','What business activity may be regulated?','textarea',true,['show_when'=>['field'=>'licensing_needed','equals'=>'yes']]),$field('existing_licenses','What existing licenses do you have, and when do they expire?','textarea',false,['show_when'=>['field'=>'licensing_needed','equals'=>'yes']]),$field('known_deadlines','Are there known filing or renewal deadlines?','textarea')],[],['intro'=>'Share what you know about possible licensing or permit needs so Alchemize can identify topics for further review.']),
        ]],
        'business_consulting' => ['label'=>'Business Consulting & Operations','modules'=>[
            $module('objectives','What is happening now?',[$field('consulting_categories','Where would support be most useful?','multiselect',true,['options'=>$options(['general_consulting','operational_setup','processes_workflows','sop_development','administrative_systems','compliance_organization','vendor_setup','staffing_workflow','other'])]),$field('current_situation','What is happening in the business right now?','textarea',true,['helper'=>'Give us enough context to understand the current situation, priorities, and people involved.']),$field('primary_challenge','Where are you getting stuck?','textarea',true,['helper'=>'Think about delays, repeated work, unclear responsibilities, missed follow-ups, manual steps, or anything that consistently slows the business down.']),$field('objectives','What would you like to improve?','textarea',true,['helper'=>'Describe what a successful outcome would look like in practical terms.']),$field('timeline','Are there important dates or timing concerns?','textarea'),$field('attempts','What have you already tried?','textarea')],[],['intro'=>'This is the starting point for a working conversation. Share what you know; your answers do not need to be formal or final.']),
            $module('operations','Systems and processes involved',[$field('current_workflows','How does the work move today?','textarea',false,['helper'=>'Describe the main steps as they currently happen, even if the process is informal.']),$field('bottlenecks','Where is the friction?','textarea',false,['helper'=>'Include delays, repeated work, unclear handoffs, missed follow-ups, or manual steps.']),$field('tools','What systems are involved?','textarea',false,['helper'=>'Include software, spreadsheets, email workflows, paper processes, vendor platforms, or other tools your team uses.']),$field('manual_processes','Which steps require repeated manual work?','textarea')],[],['intro'=>'Help us understand the practical workflow around the challenge, not just the final symptom.']),
            $module('sop','Process documentation',[$field('process_to_document','Which process needs clearer documentation?','textarea'),$field('current_documentation','What documentation already exists?','textarea'),$field('team_users','Who uses this process?'),$field('responsible_roles','Who is responsible for each part?'),$field('frequency_dependencies','How often does it happen, and what does it depend on?','textarea')],[],['intro'=>'Share how the process works today so the consultation can focus on what needs to become clearer and repeatable.']),
        ]],
        'translation' => ['label'=>'Translation Services','modules'=>[
            $module('document_details','Document details',[
                $field('document_type','What type of document is this?','text',true),
                $field('source_language','What is the source language?','text',true),
                $field('target_language','What is the target language?','text',true),
                $field('document_count','How many documents need translation?','number',false),
                $field('page_count','What is the estimated number of pages or word count, if known?','text',false),
                $field('certified_translation','Do you need a certified translation?','select',true,['options'=>$options(['yes','no','unsure'])]),
                $field('intended_use','What is the intended use, or which organization will receive this translation?','textarea',true),
                $field('receiving_organization','What organization or agency will receive this document?','text',false),
                $field('destination_country','What is the destination country or jurisdiction?','text',false),
                $field('formatting_requirements','Are there formatting or layout preservation requirements?','textarea'),
                $field('deadline','What is your desired turnaround or deadline?','date',false),
                $field('source_document_readability','Are the source documents clear and readable?','select',true,['options'=>$options(['yes','no','partially'])]),
                $field('special_instructions','Are there any special instructions we should know about?','textarea'),
            ], [['key'=>'source_documents','name'=>'Source documents','type'=>'document','necessity'=>'optional']]),
        ]],
        'apostille' => ['label'=>'Apostille Services','modules'=>[
            $module('document_details','Document and filing details',[
                $field('document_type','What type of document is this?','text',true),
                $field('document_count','How many documents need an apostille?','number',true),
                $field('issuing_state','What state or jurisdiction issued the document?','text',true),
                $field('destination_country','What is the destination country?','text',true),
                $field('document_status','What is the status of the document?','select',true,['options'=>$options(['original','certified_copy','duplicate','other'])]),
                $field('notarized_before_apostille','Has this document already been notarized or certified?','select',true,['options'=>$options(['yes','no','unsure'])]),
                $field('translation_also_needed','Is translation also needed for this document?','select',true,['options'=>$options(['yes','no','unsure'])]),
                $field('filing_deadline','What is your requested filing or return date?','date',false),
                $field('delivery_requirements','Are there delivery or return requirements?','textarea'),
                $field('special_instructions','Are there any special instructions we should know about?','textarea'),
            ], [['key'=>'apostille_documents','name'=>'Supporting documents','type'=>'document','necessity'=>'optional']]),
        ]],
        'notary' => ['label'=>'Notary Services','modules'=>[$module('matter','Notary request',[$field('document_type','What type of document is this, generally?','text',true),$field('document_count','How many documents need notarization?','number',true),$field('signer_count','How many signers are involved?','number',true),$field('signer_location','Where are the signers located?','text',true),$field('service_mode','What is your preferred service mode?','select',true,['options'=>$options(['in_person','electronic_or_remote_if_available'])]),$field('witnesses','Do you need witnesses, or do you have witnesses available?','textarea'),$field('desired_appointment','What date and time would you prefer for the appointment?','datetime-local'),$field('accessibility','Are there any accessibility or location considerations?','textarea')])]],
        'document_admin' => ['label'=>'Document & Administrative Services','modules'=>[$module('project','Administrative project',[$field('assistance_type','What type of assistance do you need?','text',true),$field('project_description','How would you describe this project?','textarea',true),$field('desired_outcome','What is the desired outcome?','textarea',true),$field('document_count','Approximately how many documents are involved?','number'),$field('requested_format','What format do you need?'),$field('deadline','What is your deadline?','date'),$field('background','What background information is relevant?','textarea'),$field('special_instructions','Are there any special instructions we should know about?','textarea')],[['key'=>'project_files','name'=>'Existing project files','type'=>'document','necessity'=>'optional']])]],
        'ongoing_support' => ['label'=>'Ongoing Business Support','modules'=>[$module('support_plan','Recurring support onboarding',[$field('support_areas','What areas of support have been agreed upon?','textarea',true),$field('recurring_responsibilities','What recurring responsibilities does this involve?','textarea',true),$field('reporting_requirements','What reporting requirements are there?','textarea'),$field('communication_preferences','What are your communication preferences?','textarea'),$field('frequency','How often is this support needed?','text',true),$field('primary_contacts','Who are the primary contacts?','person_refs'),$field('systems','What systems will Alchemize need to interact with?','textarea'),$field('access_requirements','What document or delegated access is required?','textarea'),$field('escalation_contacts','Who are the escalation contacts?','person_refs'),$field('recurring_deadlines','Are there any recurring deadlines?','textarea'),$field('existing_workflows','What existing workflows should we know about?','textarea')])]],
    ];
    $conditions = [
        'domain_notes'=>['any'=>[['field'=>'owns_domain','equals'=>'yes'],['field'=>'existing_host','equals'=>'yes']]],
        'email_migration'=>['field'=>'professional_email_exists','equals'=>'yes'],
        'email_addresses_needed'=>['field'=>'professional_email_exists','equals'=>'no'],
        'hosting_migration'=>['field'=>'existing_host','equals'=>'yes'],
        'integration_notes'=>['field'=>'integrations','not_empty'=>true],
    ];
    $documentConditions = [
        'logo'=>['field'=>'logo_available','equals'=>'yes'],
        'brand_guidelines'=>['field'=>'brand_guidelines','equals'=>'yes'],
        'existing_copy'=>['field'=>'existing_copy','in'=>['yes','partial']],
        'domain_access'=>['all'=>[['field'=>'owns_domain','equals'=>'yes'],['field'=>'dns_access_needed','equals'=>'yes']]],
    ];
    foreach ($definitions['web_digital']['modules'] as &$section) {
        foreach ($section['fields'] as &$question) {
            if (isset($conditions[$question['key']])) $question['show_when']=$conditions[$question['key']];
            if ($question['key']==='integration_notes') $question['required']=true;
        }
        unset($question);
        foreach ($section['requirements'] as &$requirement) {
            if (isset($documentConditions[$requirement['key']])) $requirement['show_when']=$documentConditions[$requirement['key']];
        }
        unset($requirement);
        if ($section['key']==='content') {
            $section['fields'][]=$field('existing_copy_details','Where is the existing copy, and what needs updating?','textarea',false,['show_when'=>['field'=>'existing_copy','in'=>['yes','partial']]]);
            $section['fields'][]=$field('copywriting_details','Which content would you like help writing?','textarea',false,['show_when'=>['field'=>'copywriting_help','equals'=>'yes']]);
        }
    }
    unset($section);
    $definitions['business_consulting']['modules'][]=$module('business_context','Business context',[
        $field('existing_business','Is this for an existing business?','select',true,['options'=>$options(['yes','no'])]),
        $field('legal_business_name','What is the name of the business?','text',false,['profile_key'=>'legal_business_name','show_when'=>['field'=>'existing_business','equals'=>'yes']]),
        $field('industry','What industry or type of business is this?'),
        $field('business_stage','What stage is the business in?','select',false,['options'=>$options(['idea','startup','operating','growth'])]),
        $field('consulting_contacts','Who are the primary decision makers or contacts?','person_refs'),
    ]);
    $definitions['business_consulting']['modules'][]=$module('supporting_information','Supporting information',[
        $field('supporting_materials','What existing documents or materials are relevant to this request?','textarea'),
        $field('additional_context','Anything else Alchemize should know before reviewing your request?','textarea'),
    ]);
    $definitions['business_consulting']['modules'][0]['fields'][0]['options']=$options(['general_consulting','operational_setup','processes_workflows','sop_development','administrative_systems','planning_strategy','financial_organization','other']);
    return $definitions;

}

// Exact catalog codes, never engagement titles or broad category guesses.
function alchemize_intake_service_families(array $codes): array
{
    $map = ['business-consulting'=>'business_consulting','business-startup'=>'business_consulting','business-operations'=>'business_consulting','business-planning'=>'business_consulting','website-design'=>'web_digital','website-maintenance'=>'web_digital','seo'=>'web_digital','google-business-profile'=>'web_digital','digital-automation'=>'web_digital','administrative-support'=>'ongoing_support','notary'=>'notary','translation'=>'translation','apostille'=>'apostille'];
    return array_values(array_unique(array_filter(array_map(static fn($code)=>$map[str_replace('_','-',strtolower($code))]??null,$codes))));
}
function alchemize_intake_visible(array $item, array $values): bool
{
    $c=$item['show_when']??null;
    if (!$c) return true;
    if (isset($c['all'])) { foreach($c['all'] as $child) if(!alchemize_intake_visible(['show_when'=>$child],$values)) return false; return true; }
    if (isset($c['any'])) { foreach($c['any'] as $child) if(alchemize_intake_visible(['show_when'=>$child],$values)) return true; return false; }
    $value=$values[$c['field']]??null;
    if (isset($c['in'])) return in_array($value,$c['in'],true);
    if (isset($c['not_empty'])) return $value!==null && $value!==[] && (!is_string($value)||trim($value)!=='');
    return $value===($c['equals']??null);
}
function alchemize_intake_answered(?array $response): bool
{
    if (!$response) return false;
    if (in_array($response['applicability']??'', ['already_on_file','not_applicable'],true)) return true;
    $value=$response['value']??null;
    return $value!==null && $value!==[] && (!is_string($value)||trim($value)!=='');
}
