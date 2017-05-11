import Ember from 'ember';
import { task, timeout } from 'ember-concurrency';
import config from 'ember-get-config';

const { get } = Ember;

export default Ember.Service.extend({

	init() {
		this._super(...arguments);
		console.log("htmlManifestUpdaterService: initializing...");
		const applicationCache = this.get("appCache");
		console.log("htmlManifestUpdaterService: enabled: "+ get(this, "timerUpdateEnabled"));
		console.log("htmlManifestUpdaterService: hour: "+ get(this, "timerHour"));

		// registering the AppCache UpdateReady handler
		applicationCache.addEventListener('updateready', this._updateReady, false);

		// if enabled, start waiting for the daily check time
		if (get(this, "timerUpdateEnabled")) {
			this.get("updateLaterTask").perform();
			console.log(`htmlManifestUpdaterService: checking for updates at ${get(this, "timerHour")}:00`);
		}
		else
		{
			console.log("htmlManifestUpdaterService: checking only at page load");
		}

		this._updateReady();
	},

	willDestroy() {
		const applicationCache = this.get("appCache");
		// removes the event listener from the AppCache
		applicationCache.removeEventListener('updateready', this._updateReady, false);
		console.log("htmlManifestUpdaterService: service removed");
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
				console.log("htmlManifestUpdaterService: date = " + date);
				const timeToCheck = (new Date()).setHours(get(this, "timerHour"));
				console.log("htmlManifestUpdaterService: timeToCheck = " + timeToCheck);
				const offset = timeToCheck - date;
				console.log("htmlManifestUpdaterService: offset = " + offset);
				
				// should we still check today?
				if(offset > 0) {
					// schedule it for later today
					delay = offset;
					console.log(`htmlManifestUpdaterService: checking today in ${delay}ms`);
				}
				else {
					// schedule it for tomorrow
					let tomorrow = new Date();
					tomorrow.setDate(date.getDate() + 1);
					tomorrow.setHours(get(this, "timerHour"));
					console.log("htmlManifestUpdaterService: tomorrow = " + tomorrow);
					delay = tomorrow - date;
					console.log(`htmlManifestUpdaterService: checking tomorrow (in ${delay}ms)`);
				}

				yield timeout(delay);
				// tell app cache to refresh
				const applicationCache = this.get("appCache");
				applicationCache.update();
			}
			catch(err) {
				console.log("htmlManifestUpdaterService: update error:\n"+err);
			}
		}
	}).drop(),

	// Event handler -- When the update is ready, reload the page
	_updateReady() {
		const applicationCache = this.get("appCache");
		console.log("htmlManifestUpdaterService: _updateReady called");
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
