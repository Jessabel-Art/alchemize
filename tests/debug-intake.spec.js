import { test } from '@playwright/test';
import { execFileSync } from 'node:child_process';

const definitions = JSON.parse(
  execFileSync(
    'php',
    ['-r', "require 'server/intake/definitions.php'; echo json_encode(alchemize_intake_definitions());"],
    { encoding: 'utf8' },
  ),
);

test('debug intake lifecycle', async ({ page }) => {
  const definition = {
    ...definitions.web_digital,
    modules: definitions.web_digital.modules.filter((m) => ['branding', 'content', 'integrations'].includes(m.key)),
  };
  const assignment = {
    id: 'intake',
    family_key: 'web_digital',
    engagement_title: 'Website Design',
    status: 'in_progress',
    completion_percentage: 0,
  };
  let responses = {};
  let submits = 0;

  await page.route('**/alchemize-api.php?*', async (route) => {
    const path = new URL(route.request().url()).searchParams.get('route');
    let data = {};
    if (path === 'auth/session') {
      data = { authenticated: true, user: { role_slug: 'client', display_name: 'Client' }, csrf_token: 'test' };
    }
    if (path === 'portal/intakes') data = { items: [assignment] };
    if (path === 'portal/intakes/intake') {
      if (route.request().method() === 'PUT' || route.request().method() === 'POST') {
        responses = { ...responses, ...route.request().postDataJSON().responses };
        console.log('SAVE PAYLOAD', route.request().postDataJSON());
        data = { completion_percentage: 0 };
      } else {
        data = {
          assignment,
          definition,
          responses,
          requirements: [{ id: 'logo', requirement_key: 'logo', requirement_name: 'Logo files', necessity: 'optional', status: 'missing', eligible_documents: [] }],
          profile: { business: {}, people: [], addresses: [] },
        };
      }
    }
    if (path === 'portal/intakes/intake/submit') {
      submits += 1;
      assignment.status = 'submitted';
      data = { status: 'submitted' };
    }
    await route.fulfill({ json: { data } });
  });

  await page.goto('/client-portal/intake?assignment=intake');
  await page.getByRole('button', { name: 'Next section', exact: true }).click();
  await page.locator('#logo_available').selectOption('no');
  await page.getByRole('button', { name: 'Next section', exact: true }).click();
  await page.locator('#existing_copy').selectOption('yes');
  await page.locator('#existing_copy_details').fill('Saved manuscript');
  await page.locator('#copywriting_help').selectOption('no');
  await page.getByRole('button', { name: 'Save and continue later', exact: true }).click();
  await page.getByText(/Your information is saved/).waitFor();
  await page.reload();
  await page.getByRole('navigation', { name: 'Intake sections' }).getByRole('button', { name: /Content/ }).click();
  await page.locator('#existing_copy_details').waitFor();
  await page.locator('#existing_copy').selectOption('no');
  await page.getByRole('button', { name: 'Next section', exact: true }).click();
  await page.getByLabel('Crm', { exact: true }).check();
  console.log('before submit body=', await page.locator('body').innerText());
  await page.getByRole('button', { name: 'Submit to Alchemize', exact: true }).click();
  console.log('after first submit body=', await page.locator('body').innerText());
  await page.locator('#integration_notes').fill('Sync contacts');
  console.log('after input value=', await page.locator('#integration_notes').inputValue());
  await page.getByRole('button', { name: 'Submit to Alchemize', exact: true }).click();
  console.log('after second submit body=', await page.locator('body').innerText());
  console.log('submits=', submits);
});
