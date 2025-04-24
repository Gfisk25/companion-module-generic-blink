module.exports = {
	initVariables: function () {
		let self = this;
		
		let variables = []

		// Variable to show current blink state based on schedule/manual stop
		variables.push({ variableId: 'is_blinking_active', name: 'Is Blinking Active (Scheduled)' });

		// Existing variables based on config
		if (self.config.specifyCustomOnOff) {
			variables.push({ variableId: 'onTime', name: 'Configured On Time (ms)' }) // Renamed for clarity
			variables.push({ variableId: 'offTime', name: 'Configured Off Time (ms)' }) // Renamed for clarity
		}
		else {
			variables.push({ variableId: 'rate', name: 'Configured Blink Rate (ms)' }) // Renamed for clarity
		}

		self.setVariableDefinitions(variables);
	},

	checkVariables: function () {
		let self = this;

		try {
			let variableValues = {}; // Use let or const

			// Set the new status variable - its value is managed in index.js now
			// We just need to ensure it's included in the update object
			variableValues['is_blinking_active'] = self.isBlinkingActive ? 'Yes' : 'No'; // Get value from index.js state

			// Set existing config variables
			if (self.config.specifyCustomOnOff) {
				variableValues['onTime'] = self.config.onTime;
				variableValues['offTime'] = self.config.offTime;
			}
			else {
				variableValues['rate'] = self.config.rate;
			}
			
			self.setVariableValues(variableValues);
		}
		catch(error) {
			self.log('error', 'Error setting Variables: ' + String(error))
			console.log(error);
		}
	}
}
