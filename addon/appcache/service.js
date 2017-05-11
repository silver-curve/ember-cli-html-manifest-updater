import Ember from 'ember';
import { task, timeout } from 'ember-concurrency';
import config from 'ember-get-config';

export default Ember.Service.extend({

	init() {
		this._super(...arguments);
		console.log("htmlManifestUpdaterService: initializing...");
		const applicationCache = this.get("appCache");

		// registering the AppCache UpdateReady handler
		applicationCache.addEventListener('updateready', this._updateReady, false);

		// if enabled, start waiting for the daily check time
		if (this.get("timerUpdateEnabled")) {
			this.get("updateLaterTask").perform();
		}

		console.log("htmlManifestUpdaterService: started!");
	},

	willDestroy() {
		const applicationCache = this.get("appCache");
		// removes the event listener from the AppCache
		applicationCache.removeEventListener('updateready', this._updateReady, false);
		this._super(...arguments);
	},

	appCache: Ember.computed({
		get() {
			return window.applicationCache;
		}
	}),

	updateLaterTask: task(function* () {
		while (true) {
			try {
				let delay = 0;
				const date = new Date();
				const timeToCheck = (new Date()).setHours(this.timerHour);
				const offset = Math.abs(timeToCheck - date);
				
				// should we still check today?
				if(offset > 0) {
					// schedule it for later today
					delay = offset;
				}
				else {
					// schedule it for tomorrow
					let tomorrow = new Date();
					tomorrow.setDate(date.getDate() + 1);
					tomorrow.setHours(this.timerHour);
					delay = Math.abs(tomorrow - date);
				}

				yield timeout(delay);
				// tell app cache to refresh
				const applicationCache = this.get("appCache");
				applicationCache.update();
			}
			catch(err) {
				console.log("HTML Manifest update error:\n"+err);
			}
		}
	}).drop(),

	// Event handler -- When the update is ready, reload the page
	_updateReady() {
		const applicationCache = this.get("appCache");
		if (applicationCache.status === applicationCache.UPDATEREADY) {
			// use the new manifest
			applicationCache.swapCache();
			// reload the page
			window.location.reload();
		}
	},

	timerUpdateEnabled: Ember.computed(function () {
		return config.APP.htmlManifestUpdater.timerUpdateEnabled;
	}),

	timerHour: Ember.computed(function () {
		let hour = config.APP.htmlManifestUpdater.timerHour;
		return (hour >= 0) && (hour <= 23) ? hour : 3;
	})

});
