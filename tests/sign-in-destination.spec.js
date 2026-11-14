import { test, expect } from '@playwright/test';
import { signInDestination, accountEntryLink } from '../src/sign-in-destination.js';

test('sign-in destinations reject external URLs, auth loops and ambiguous pages', () => {
  for (const value of [null, '', 'https://example.com', '//example.com', '/?page=account', '?page=sign-in', '?page=auth-callback', '?page=register', '?page=account&page=provider-review', '?page=unknown']) {
    expect(signInDestination(value)).toBeNull();
  }
});

test('sign-in destinations retain only the tool route and strip sensitive or destructive context', () => {
  expect(signInDestination('?page=create-listing&new=1&draft=private-id&access_token=secret&next=https://example.com#private')).toBe('?page=create-listing');
  expect(accountEntryLink('register', '?page=availability&code=secret')).toBe('?page=register&next=%3Fpage%3Davailability');
  expect(accountEntryLink('account', '?page=availability')).toBe('?page=account');
});

test('backend-disabled sign-in never offers authenticated continuation', async ({ page }) => {
  await page.goto('/?page=sign-in&next=%3Fpage%3Daccount-security');
  await page.getByRole('button', { name: 'I am 18 or older' }).click();
  await page.getByRole('button', { name: 'Use fictional example' }).click();
  await page.getByRole('button', { name: 'Check sign-in preview', exact: true }).click();
  await expect(page.locator('.account-preview-result')).toContainText('you have not been signed in');
  await expect(page.getByRole('link', { name: 'Continue to your requested page' })).toBeHidden();
});
