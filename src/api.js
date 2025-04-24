const { InstanceStatus } = require('@companion-module/base')

module.exports = {
	startInterval: function() {
		let self = this;
		self.stopInterval();

		if (self.config.specifyCustomOnOff) {
			self.flipTimeout();
		}
		else {
			self.INTERVAL = setInterval(() => {
				self.boolValue = !self.boolValue;
				self.checkFeedbacks();
			}, self.config.rate);
		}
	},

	flipTimeout() {
		let self = this;

		self.boolValue = !self.boolValue;
		self.checkFeedbacks();

		self.INTERVAL = setTimeout(() => {
			self.flipTimeout();
		}, self.boolValue ? self.config.onTime : self.config.offTime);
	},

	stopInterval: function() {
		let self = this;
		clearInterval(self.INTERVAL);
		self.INTERVAL = null;
	},

	setOnOffTimes: function(onTime, offTime) {
		let self = this;
		self.config.onTime = onTime;
		self.config.offTime = offTime;
		self.checkVariables();
		self.saveConfig(self.config);
		// self.startInterval(); // REMOVED - Schedule checker in index.js handles this now
		this.log('debug', `On/Off times updated to On: ${onTime}, Off: ${offTime}. Schedule checker will control interval.`);
	},

	setRate: function(rate) {
		let self = this;
		self.config.rate = rate;
		self.checkVariables();
		self.saveConfig(self.config);
		// self.startInterval(); // REMOVED - Schedule checker in index.js handles this now
		this.log('debug', `Rate updated to: ${rate}. Schedule checker will control interval.`);
	},
}