import { test, expect } from '@playwright/test';
import { trackDraft, hasUnsavedDrafts } from '../src/draft-changes.js';

test('pending-save snapshots preserve edits made while a save is in progress', () => {
  let draft = { title: '' };
  const tracker = trackDraft('race-test', () => draft);
  expect(tracker.isDirty()).toBe(false);
  draft.title = 'Snapshot sent to server';
  const sent = { ...draft };
  draft.title = 'Newer local edit';
  tracker.saved(sent);
  expect(tracker.isDirty()).toBe(true);
  expect(hasUnsavedDrafts()).toBe(true);
  tracker.saved();
  expect(tracker.isDirty()).toBe(false);
  draft = { title: 'Loaded server draft' };
  tracker.saved();
  expect(tracker.isDirty()).toBe(false);
});
test('demo-only changes do not register as unsaved private drafts', () => {
  let draft = 'empty';
  const tracker = trackDraft('disabled-test', () => draft, false);
  draft = 'fictional preview';
  expect(tracker.isDirty()).toBe(false);
});
