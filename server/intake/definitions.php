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

    return [
        'client_profile' => ['label' => 'Client Profile', 'modules' => [
            $module('contact', 'Personal and contact information', [
                $field('legal_name', 'Legal name', 'text', true), $field('preferred_name', 'Preferred name'),
                $field('primary_email', 'Primary email', 'email', true), $field('primary_phone', 'Primary phone', 'tel', true),
                $field('preferred_contact_method', 'Preferred communication method', 'select', true, ['options' => $options(['email','phone','either'])]),
                $field('client_type', 'Client type', 'select', true, ['options' => $options(['individual','business','both'])]),
            ]),
            $module('business', 'Business information', [
                $field('legal_business_name', 'Legal business name'), $field('dba_name', 'DBA / trade name'),
                $field('entity_type', 'Entity type'), $field('formation_state', 'State of formation'),
                $field('formation_date', 'Formation date', 'date'), $field('ein_status', 'EIN status', 'select', false, ['options' => $options(['unknown','not_requested','requested','issued'])]),
                $field('industry', 'Industry'), $field('business_description', 'Business description', 'textarea'),
                $field('business_phone', 'Business phone', 'tel'), $field('business_email', 'Business email', 'email'), $field('website', 'Website', 'url'),
            ]),
            $module('digital_presence', 'Digital presence', [
                $field('domain_name', 'Domain name'), $field('domain_registrar', 'Domain registrar'),
                $field('email_provider', 'Business email provider'), $field('social_profiles', 'Social media/profile URLs', 'textarea'),
            ]),
            $module('people', 'Owners & key contacts', [
                $field('business_people', 'People connected to your business', 'people', false, ['helper' => 'Add the people involved in ownership, business decisions, or this service. Include ownership percentage only if it has already been determined.']),
            ], [], ['intro' => 'Keep reusable contact and ownership information together so it can support future services.']),
            $module('addresses', 'Addresses', [$field('addresses', 'Principal, business, and mailing addresses', 'address_refs')]),
        ]],
        'web_digital' => ['label' => 'Web & Digital Solutions', 'modules' => [
            $module('project_overview', 'Project overview', [
                $field('project_type', 'Project type', 'multiselect', true, ['options' => $options(['new_website','website_redesign','web_presence','domain_setup','dns_configuration','business_email','hosting_deployment','seo','analytics','integrations','website_maintenance','other'])]),
                $field('project_goals', 'Project goals', 'textarea', true), $field('primary_outcome', 'Primary outcome', 'textarea', true),
                $field('target_audience', 'Target audience', 'textarea'), $field('project_contacts', 'Primary project contacts / decision makers', 'person_refs'), $field('desired_launch_date', 'Desired launch date', 'date'), $field('known_deadlines', 'Known deadlines', 'textarea'),
                $field('profile_business_confirmed', 'Is the business in your Client Profile the business this project is for?', 'select', true, ['options' => $options(['yes','no'])]),
                $field('alternate_business', 'Tell us which business this project is for', 'text', true, ['helper' => 'This project is for a different business than the one saved in your profile, so we need a few additional details.', 'show_when' => ['field' => 'profile_business_confirmed', 'equals' => 'no']]),
            ], [], ['intro' => 'Start with what you want the digital presence to accomplish and who it needs to serve.']),
            $module('website_requirements', 'Website requirements', [
                $field('site_mode', 'Website project', 'select', true, ['options' => $options(['new_site','redesign'])]),
                $field('existing_site_url', 'Existing site URL', 'url', true, ['show_when' => ['field' => 'site_mode', 'equals' => 'redesign']]),
                $field('required_pages', 'Required pages', 'textarea'), $field('functionality', 'Desired functionality', 'multiselect', false, ['options' => $options(['contact_forms','ecommerce','booking','client_portal','payment_processing','crm','other_integrations'])]),
                $field('calls_to_action', 'Primary calls to action', 'textarea'),
            ], [], ['intro' => 'Tell us what the website needs to include and what visitors should be able to do.']),
            $module('ui_ux', 'UI / UX direction', [
                $field('visual_direction', 'Desired visual direction', 'textarea'), $field('brand_personality', 'Brand personality', 'textarea'),
                $field('liked_sites', 'Websites you like and why', 'textarea'), $field('disliked_sites', 'Websites you dislike and why', 'textarea'),
                $field('navigation_needs', 'Navigation needs', 'textarea'), $field('accessibility_considerations', 'Accessibility considerations', 'textarea'), $field('key_visitor_actions', 'Key visitor actions', 'textarea'),
            ], [], ['intro' => 'Help us understand how you want the site to feel and what visitors should be able to accomplish.']),
            $module('branding', 'Branding assets', [
                $field('logo_available', 'Logo available?', 'select', true, ['options' => $options(['yes','no'])]),
                $field('logo_formats', 'Available logo formats', 'text', false, ['show_when' => ['field' => 'logo_available', 'equals' => 'yes']]),
                $field('brand_colors', 'Brand colors'), $field('typography', 'Typography / fonts'), $field('brand_guidelines', 'Brand guidelines available?', 'select', false, ['options' => $options(['yes','no'])]),
                $field('visual_assets', 'Photography, illustrations, icons, and other assets', 'textarea'),
            ], [['key'=>'logo','name'=>'Logo files','type'=>'asset','necessity'=>'optional'],['key'=>'brand_guidelines','name'=>'Brand guidelines','type'=>'document','necessity'=>'optional'],['key'=>'photography','name'=>'Photography / visual assets','type'=>'asset','necessity'=>'optional']], ['intro' => 'Share the visual assets you already have. If something is missing, that is okay—tell us where things stand.']),
            $module('content', 'Content', [
                $field('existing_copy', 'Do you have existing copy?', 'select', true, ['options' => $options(['yes','no','partial'])]),
                $field('copywriting_help', 'Copywriting assistance needed?', 'select', true, ['options' => $options(['yes','no','unsure'])]),
                $field('content_owner', 'Who will provide content?'), $field('legal_content', 'Required legal, disclaimer, policy, or compliance pages', 'textarea'),
            ], [['key'=>'existing_copy','name'=>'Existing website copy','type'=>'asset','necessity'=>'optional']], ['intro' => 'Let us know what content already exists and what still needs to be created.']),
            $module('domain_dns', 'Domain and DNS', [
                $field('owns_domain', 'Do you currently own the domain you intend to use?', 'select', true, ['options' => $options(['yes','no'])]),
                $field('domain_name', 'Domain name', 'text', true, ['helper' => 'Since you already own the domain, we only need enough information to understand how it is currently managed.', 'show_when' => ['field' => 'owns_domain', 'equals' => 'yes']]),
                $field('registrar', 'Registrar', 'text', false, ['show_when' => ['field' => 'owns_domain', 'equals' => 'yes']]),
                $field('dns_access_needed', 'Will Alchemize need delegated DNS access?', 'select', false, ['options' => $options(['yes','no','unsure']), 'show_when' => ['field' => 'owns_domain', 'equals' => 'yes']]),
                $field('transfer_required', 'Is a transfer requested?', 'select', false, ['options' => $options(['yes','no','unsure']), 'show_when' => ['field' => 'owns_domain', 'equals' => 'yes']]),
                $field('preferred_domain', 'Preferred domain', 'text', true, ['helper' => 'We can help with registration and setup. Tell us what you have in mind.', 'show_when' => ['field' => 'owns_domain', 'equals' => 'no']]),
                $field('alternate_domains', 'Alternative domain options', 'textarea', false, ['show_when' => ['field' => 'owns_domain', 'equals' => 'no']]),
                $field('registration_help', 'Would you like registration assistance?', 'select', true, ['options' => $options(['yes','no']), 'show_when' => ['field' => 'owns_domain', 'equals' => 'no']]),
                $field('domain_notes', 'Existing DNS / hosting notes', 'textarea'),
            ], [['key'=>'domain_access','name'=>'Delegated domain/DNS access','type'=>'access','necessity'=>'optional']], ['intro' => 'Tell us where things currently stand with your domain. We will only ask the questions that apply to your setup. DNS is the connection that directs your domain to services such as your website and business email.']),
            $module('business_email', 'Professional business email', [
                $field('professional_email_exists', 'Do you have professional business email?', 'select', true, ['options' => $options(['yes','no'])]),
                $field('email_provider', 'Current provider', 'text', false, ['show_when' => ['field' => 'professional_email_exists', 'equals' => 'yes']]),
                $field('email_addresses_needed', 'Email addresses needed', 'textarea'), $field('email_migration', 'Is migration required?', 'select', false, ['options' => $options(['yes','no','unsure'])]),
                $field('email_assistance', 'Assistance requested', 'textarea'),
            ], [], ['intro' => 'Tell us whether email using your business domain already exists and what support may be needed.']),
            $module('hosting', 'Hosting and deployment', [
                $field('existing_host', 'Do you have an existing host?', 'select', true, ['options' => $options(['yes','no'])]),
                $field('hosting_provider', 'Hosting provider', 'text', false, ['show_when' => ['field' => 'existing_host', 'equals' => 'yes']]),
                $field('hosting_migration', 'Is migration needed?', 'select', false, ['options' => $options(['yes','no','unsure'])]),
                $field('managed_deployment', 'Alchemize-managed deployment requested?', 'select', false, ['options' => $options(['yes','no','unsure'])]),
            ], [], ['intro' => 'Hosting is where the website runs. Share what is already in place, if anything.']),
            $module('seo_analytics', 'SEO and analytics', [
                $field('seo_requested', 'SEO support requested?', 'select', true, ['options' => $options(['yes','no'])]),
                $field('target_locations', 'Target locations', 'textarea', false, ['show_when' => ['field' => 'seo_requested', 'equals' => 'yes']]),
                $field('target_services_keywords', 'Target services / keywords', 'textarea', false, ['show_when' => ['field' => 'seo_requested', 'equals' => 'yes']]),
                $field('analytics_tools', 'Existing analytics / tracking', 'multiselect', false, ['options' => $options(['google_analytics','search_console','other_tracking','none'])]),
            ], [], ['intro' => 'Tell us how people should find the business and what website activity is already being measured.']),
            $module('integrations', 'Integrations', [$field('integrations', 'Third-party integrations', 'multiselect', false, ['options' => $options(['payment_provider','calendar','crm','forms','email_marketing','social_links','other'])]), $field('integration_notes', 'Integration details', 'textarea')], [], ['intro' => 'Select the outside tools or services the website may need to connect with.']),
        ]],
        'business_formation' => ['label'=>'Business Formation & Registration','modules'=>[
            $module('business', 'Business and jurisdiction', [$field('formation_services','Services needed','multiselect',true,['options'=>$options(['new_formation','entity_registration','ein_assistance','licensing','permits','existing_registration'])]),$field('proposed_legal_name','Proposed legal name','text',true),$field('alternate_names','Alternate names','textarea'),$field('business_activity','Business activity','textarea',true),$field('products_services','Products / services','textarea'),$field('jurisdiction','State / jurisdiction','text',true),$field('operating_locations','Counties / cities of operation','textarea'),$field('expected_launch_date','Expected launch date','date')]),
            $module('ownership','Owners & key contacts',[$field('owners','Owners or members for this service','person_refs',true,['helper'=>'Select the people already saved to your profile. Include ownership percentage only if it has already been determined.']),$field('engagement_address','Address to use for this service','address_refs',true),$field('management_structure','How do you expect the business to be managed?','textarea',false,['helper'=>'Share what is currently understood. You do not need to finalize an ownership or management structure through this intake.']),$field('authorized_representatives','Authorized representatives for this service','person_refs')],[],['intro'=>'Add or select the people involved in ownership, business decisions, or this service.']),
            $module('formation','Formation information',[$field('formation_status','Is this a new or existing business?','select',true,['options'=>$options(['new','existing'])]),$field('preferred_entity_type','If you already have a business structure in mind, what are you considering?','text',false,['helper'=>'If you are unsure, leave this open for discussion. This intake does not make a legal or entity-selection determination.']),$field('registered_agent_status','Do you already have a registered agent arrangement?','select',false,['options'=>$options(['yes','no','unsure'])]),$field('existing_formation_date','Existing formation date','date',false,['show_when'=>['field'=>'formation_status','equals'=>'existing']]),$field('existing_ein','Does the business already have an EIN?','select',true,['options'=>$options(['yes','no','unknown'])])],[],['intro'=>'Provide what you already know. Alchemize will review this information with you; the form does not provide legal advice or select an entity type.']),
            $module('licensing','Licensing and permits',[$field('licensing_needed','Do you believe the business may require professional, industry, state, county, or local licensing?','select',true,['options'=>$options(['yes','no','unsure']),'helper'=>'This helps identify what may need further review. It is not a licensing determination.']),$field('license_industry','Business activity that may be regulated','textarea',true,['show_when'=>['field'=>'licensing_needed','equals'=>'yes']]),$field('existing_licenses','Existing licenses and expiration dates','textarea',false,['show_when'=>['field'=>'licensing_needed','equals'=>'yes']]),$field('known_deadlines','Known filing or renewal deadlines','textarea')],[],['intro'=>'Share what you know about possible licensing or permit needs so Alchemize can identify topics for further review.']),
        ]],
        'business_consulting' => ['label'=>'Business Consulting & Operations','modules'=>[
            $module('objectives','What is happening now?',[$field('consulting_categories','Where would support be most useful?','multiselect',true,['options'=>$options(['general_consulting','operational_setup','processes_workflows','sop_development','administrative_systems','compliance_organization','vendor_setup','staffing_workflow','other'])]),$field('current_situation','What is happening in the business right now?','textarea',true,['helper'=>'Give us enough context to understand the current situation, priorities, and people involved.']),$field('primary_challenge','Where are you getting stuck?','textarea',true,['helper'=>'Think about delays, repeated work, unclear responsibilities, missed follow-ups, manual steps, or anything that consistently slows the business down.']),$field('objectives','What would you like to improve?','textarea',true,['helper'=>'Describe what a successful outcome would look like in practical terms.']),$field('timeline','Are there important dates or timing concerns?','textarea'),$field('attempts','What have you already tried?','textarea')],[],['intro'=>'This is the starting point for a working conversation. Share what you know; your answers do not need to be formal or final.']),
            $module('operations','Systems and processes involved',[$field('current_workflows','How does the work move today?','textarea',false,['helper'=>'Describe the main steps as they currently happen, even if the process is informal.']),$field('bottlenecks','Where is the friction?','textarea',false,['helper'=>'Include delays, repeated work, unclear handoffs, missed follow-ups, or manual steps.']),$field('tools','What systems are involved?','textarea',false,['helper'=>'Include software, spreadsheets, email workflows, paper processes, vendor platforms, or other tools your team uses.']),$field('manual_processes','Which steps require repeated manual work?','textarea')],[],['intro'=>'Help us understand the practical workflow around the challenge, not just the final symptom.']),
            $module('sop','Process documentation',[$field('process_to_document','Which process needs clearer documentation?','textarea'),$field('current_documentation','What documentation already exists?','textarea'),$field('team_users','Who uses this process?'),$field('responsible_roles','Who is responsible for each part?'),$field('frequency_dependencies','How often does it happen, and what does it depend on?','textarea')],[],['intro'=>'Share how the process works today so the consultation can focus on what needs to become clearer and repeatable.']),
        ]],
        'notary' => ['label'=>'Notary Services','modules'=>[$module('matter','Notary request',[$field('document_type','General document type','text',true),$field('document_count','Number of documents','number',true),$field('signer_count','Number of signers','number',true),$field('signer_location','Signer location','text',true),$field('service_mode','Preferred service mode','select',true,['options'=>$options(['in_person','electronic_or_remote_if_available'])]),$field('witnesses','Witnesses needed / available','textarea'),$field('desired_appointment','Desired appointment date/time','datetime-local'),$field('accessibility','Accessibility or location considerations','textarea')])]],
        'document_admin' => ['label'=>'Document & Administrative Services','modules'=>[$module('project','Administrative project',[$field('assistance_type','Type of assistance','text',true),$field('project_description','Project description','textarea',true),$field('desired_outcome','Desired outcome','textarea',true),$field('document_count','Approximate document count','number'),$field('requested_format','Requested format'),$field('deadline','Deadline','date'),$field('background','Relevant background','textarea'),$field('special_instructions','Special instructions','textarea')],[['key'=>'project_files','name'=>'Existing project files','type'=>'document','necessity'=>'optional']])]],
        'ongoing_support' => ['label'=>'Ongoing Business Support','modules'=>[$module('support_plan','Recurring support onboarding',[$field('support_areas','Agreed areas of support','textarea',true),$field('recurring_responsibilities','Recurring responsibilities','textarea',true),$field('reporting_requirements','Reporting requirements','textarea'),$field('communication_preferences','Communication preferences','textarea'),$field('frequency','Support frequency','text',true),$field('primary_contacts','Primary contacts','person_refs'),$field('systems','Systems Alchemize will interact with','textarea'),$field('access_requirements','Document / delegated access requirements','textarea'),$field('escalation_contacts','Escalation contacts','person_refs'),$field('recurring_deadlines','Recurring deadlines','textarea'),$field('existing_workflows','Existing workflows','textarea')])]],
    ];
}
