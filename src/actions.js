module.exports = {
	initActions: function () {
		let self = this;
		
		let actions = {}

		// --- Schedule Control Actions ---
		actions.addBlinkSchedule = {
			name: 'Add Blink Schedule',
			options: [
				{
					type: 'textinput',
					label: 'Start Time (HH:MM)',
					id: 'startTime',
					regex: '/^([01]\\d|2[0-3]):([0-5]\\d)$/', // Basic HH:MM validation
					default: '09:00',
					required: true,
				},
				{
					type: 'textinput',
					label: 'End Time (HH:MM)',
					id: 'endTime',
					regex: '/^([01]\\d|2[0-3]):([0-5]\\d)$/', // Basic HH:MM validation
					default: '17:00',
					required: true,
				}
			],
			callback: async function (action) {
				let startTime = await self.parseVariablesInString(action.options.startTime);
				let endTime = await self.parseVariablesInString(action.options.endTime);
				self.addSchedule(startTime, endTime); // Call method added to index.js
			}
		};

		actions.clearBlinkSchedules = {
			name: 'Clear All Blink Schedules',
			options: [],
			callback: async function (action) {
				self.clearSchedules(); // Call method added to index.js
			}
		};

		actions.manualStopBlink = {
			name: 'Manual Stop Current Blink Block',
			options: [],
			callback: async function (action) {
				self.performManualStop(); // Call method added to index.js
			}
		};

		// --- Timing Adjustment Actions ---
		if (self.config.specifyCustomOnOff) {
			actions.setOnOffTimes = {
				name: 'Set Custom On/Off Times', // Renamed slightly for clarity
				options: [
					{
						type: 'textinput',
						label: 'On Time (ms)',
						id: 'onTime',
						default: 1000,
						tooltip: 'The time in milliseconds the button will be on.',
						required: true,
						useVariables: true,
						min: 100,
						max: 10000
					},
					{
						type: 'textinput',
						label: 'Off Time (ms)',
						id: 'offTime',
						default: 500,
						tooltip: 'The time in milliseconds the button will be off.',
						required: true,
						useVariables: true,
						min: 100,
						max: 10000
					}
				],
				callback: async function (action) {
                    let onTime = parseInt(await(self.parseVariablesInString(action.options.onTime)));
                    let offTime = parseInt(await(self.parseVariablesInString(action.options.offTime)));
					// Note: setOnOffTimes in api.js will no longer call startInterval directly
					self.setOnOffTimes(onTime, offTime);
					// The schedule checker will handle restarting if needed based on current time
				}
			}
		}
		else {
			actions.setRate = {
				name: 'Set Simple Blink Rate', // Renamed slightly for clarity
				options: [
					{
						type: 'textinput',
						label: 'Rate (ms)',
						id: 'rate',
						default: 1000,
						tooltip: 'The rate in milliseconds at which the buttons will blink. 1000ms = 1 second.',
						required: true,
						useVariables: true,
						min: 100,
						max: 10000
					}
				],
				callback: async function (action) {
                    let rate = parseInt(await(self.parseVariablesInString(action.options.rate)));
					// Note: setRate in api.js will no longer call startInterval directly
					self.setRate(rate);
					// The schedule checker will handle restarting if needed based on current time
				}
			}
		}

		self.setActionDefinitions(actions);
	}
}
