module.exports = {
	initVariables: function () {
		let self = this;
		
		let variables = []

		if (self.config.specifyCustomOnOff) {
			variables.push({ variableId: 'onTime', name: 'On Time' })
			variables.push({ variableId: 'offTime', name: 'Off Time' })
		}
		else {
			variables.push({ variableId: 'rate', name: 'Blink Rate' })
		}

		variables.push({ variableId: 'duration', name: 'Blink Duration' })
		self.setVariableDefinitions(variables);
	},

	checkVariables: function () {
		let self = this;

		try {
			variableValues = {};

			if (self.config.specifyCustomOnOff) {
				variableValues['onTime'] = self.config.onTime;
				variableValues['offTime'] = self.config.offTime;
			}
			else {
				variableValues['rate'] = self.config.rate;
			}
			
			variableValues['duration'] = self.config.duration;
			
			self.setVariableValues(variableValues);
		}
		catch(error) {
			self.log('error', 'Error setting Variables: ' + String(error))
			console.log(error);
		}
	}
}
