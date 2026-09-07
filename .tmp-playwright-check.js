const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.route('**/alchemize-api.php?*', async (route) => {
    const path = new URL(route.request().url()).searchParams.get('route');
    let data = [];
    if (path === 'auth/session') {
      data = { authenticated: true, user: { user_id:1, role_slug:'owner-admin' }, csrf_token:'test-token' };
    } else if (path === 'settings') {
      if (route.request().method() === 'PUT') {
        data = route.request().postDataJSON();
        console.log('PUT settings payload', JSON.stringify(data));
      } else {
        data = { business_name:'Existing business', business_email:'ops@example.com', timezone:'America/New_York', appointment_default_duration:75, portal_message_email_notifications:false };
      }
    } else if (path === 'portal-admin/attention') {
      data = { items: [] };
    }
    await route.fulfill({ json: { data } });
  });
  await page.goto('http://127.0.0.1:4173/admin/settings/');
  console.log('TITLE', await page.title());
  await page.getByLabel('Business name', { exact: true }).fill('Alchemize Business Services');
  const btn = page.getByRole('button', { name: 'Save Settings', exact: true });
  console.log('button count', await btn.count());
  console.log('button visible', await btn.isVisible());
  console.log('button disabled', await btn.isDisabled());
  await btn.click({ timeout: 15000 }).catch(err => console.log('CLICK_ERR', err.message));
  await page.waitForTimeout(2000);
  console.log('BODY', (await page.locator('body').innerText()).slice(0, 800));
  await browser.close();
})();
