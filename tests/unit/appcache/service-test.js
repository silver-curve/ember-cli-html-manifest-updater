import { moduleFor, test } from 'ember-qunit';

moduleFor('service:appcache', 'Unit | Service | appcache', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
});

// Replace this with your real tests.
test('it exists', function(assert) {
  let service = this.subject();
  assert.ok(service);
});

test('service updates at startup if startup-update is enabled', function(assert) {
  let service = this.subject();
  assert.equal(service.get("timerUpdateEnabled"), true);
});

test('service does update at startup if startup-update is undefined', function(assert) {
  let service = this.subject();
  assert.equal(service.get("timerHour"), 17);
});
