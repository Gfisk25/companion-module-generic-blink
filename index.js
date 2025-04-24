const { InstanceBase, InstanceStatus, runEntrypoint } = require('@companion-module/base')

const UpgradeScripts = require('./src/upgrades');

const configFields = require('./src/configFields');
const actions = require('./src/actions');
const feedbacks = require('./src/feedbacks');
const variables = require('./src/variables');

const api = require('./src/api');

class GenericBlinkInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.INTERVAL = null; // Timer for the actual blink flip
		this.boolValue = false; // Current state of the blink (on/off)
		this.scheduleCheckInterval = null; // Timer for checking the schedule
		this.schedules = []; // Array to hold schedule objects: { start: 'HH:MM', end: 'HH:MM', manuallyStopped: false }
		this.isBlinkingActive = false; // Tracks if the blink *should* be running based on schedule/manual stop

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...configFields,
			...actions,
			...feedbacks,
			...variables,
			...api,
		})
	}

	async init(config) {
		this.log('debug', 'Initializing module');
		this.config = config;
		this.schedules = this.config.schedules || []; // Load schedules from config if they exist
		this.isBlinkingActive = false;

		this.initActions(); // Initialize actions first
		this.initFeedbacks();
		this.initVariables();
		this.checkVariables();

		// Start the schedule checker - adjust interval as needed (e.g., 10000ms = 10 seconds)
		this.scheduleCheckInterval = setInterval(() => {
			this.checkSchedule();
		}, 10000); // Check every 10 seconds

		// Perform an initial check immediately
		this.checkSchedule();

		this.updateStatus(InstanceStatus.Ok);
	}

	async configUpdated(config) {
		this.log('debug', 'Configuration updated');
		if (config) {
			this.config = config;
			// Update schedules if they are part of the config now
			this.schedules = this.config.schedules || this.schedules; // Keep existing if not in new config
		}

		// Re-initialize based on new config
		this.initActions();
		this.initFeedbacks();
		this.initVariables();
		this.checkVariables();

		// Stop existing blink interval if running, schedule checker will restart if needed
		this.stopInterval();
		this.isBlinkingActive = false; // Reset active state

		// Re-evaluate schedule immediately with new config
		this.checkSchedule();

		this.updateStatus(InstanceStatus.Ok);
	}

	async destroy() {
		this.log('debug', 'Destroying module');
		// Clear the schedule check interval
		if (this.scheduleCheckInterval) {
			clearInterval(this.scheduleCheckInterval);
			this.scheduleCheckInterval = null;
		}
		// Stop the main blink interval if running
		this.stopInterval();
	}

	// --- New Schedule Methods ---

	addSchedule(startTime, endTime) {
		// Basic validation (can be improved)
		if (typeof startTime === 'string' && startTime.match(/^\d{2}:\d{2}$/) &&
		    typeof endTime === 'string' && endTime.match(/^\d{2}:\d{2}$/)) {
			this.schedules.push({ start: startTime, end: endTime, manuallyStopped: false });
			this.log('info', `Added schedule: ${startTime} - ${endTime}`);
			// Optionally save to config for persistence
			// this.saveConfig({ ...this.config, schedules: this.schedules });
			this.checkSchedule(); // Re-check immediately
		} else {
			this.log('warn', `Invalid schedule format received: Start=${startTime}, End=${endTime}`);
		}
	}

	clearSchedules() {
		this.log('info', 'Clearing all schedules');
		this.schedules = [];
		// Optionally save to config for persistence
		// this.saveConfig({ ...this.config, schedules: this.schedules });
		this.checkSchedule(); // Re-check immediately
	}

	performManualStop() {
		let stoppedSomething = false;
		const now = new Date();
		const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

		this.schedules.forEach(schedule => {
			// Check if current time is within this schedule block
			if (currentTime >= schedule.start && currentTime < schedule.end) {
				if (!schedule.manuallyStopped) {
					schedule.manuallyStopped = true;
					stoppedSomething = true;
					this.log('info', `Manually stopping schedule block: ${schedule.start} - ${schedule.end}`);
				}
			}
		});

		if (stoppedSomething && this.isBlinkingActive) {
			this.log('debug', 'Manual stop triggered, stopping active blink interval.');
			this.stopInterval(); // Stop the blink timer
			this.isBlinkingActive = false;
			this.boolValue = false; // Ensure visual state is off
			this.checkFeedbacks(); // Update buttons
			this.checkVariables(); // Update any related variables
		} else if (!stoppedSomething) {
			this.log('debug', 'Manual stop triggered, but no active, non-stopped schedule found.');
		}
	}

	checkSchedule() {
		const now = new Date();
		const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
		let shouldBeBlinking = false;

		// Phase 1: Reset flags for schedules that have ended
		this.schedules.forEach(schedule => {
			if (currentTime >= schedule.end && schedule.manuallyStopped) {
				this.log('debug', `Resetting manuallyStopped flag for ended schedule: ${schedule.start} - ${schedule.end}`);
				schedule.manuallyStopped = false;
			}
		});

		// Phase 2: Determine if any active, non-stopped schedule exists
		for (const schedule of this.schedules) {
			if (currentTime >= schedule.start && currentTime < schedule.end && !schedule.manuallyStopped) {
				shouldBeBlinking = true;
				break; // Found at least one reason to blink
			}
		}

		// Phase 3: Control the blink interval
		if (shouldBeBlinking && !this.isBlinkingActive) {
			// Start blinking
			this.log('debug', `Schedule check: Starting blink (Active: ${shouldBeBlinking}, Currently Running: ${this.isBlinkingActive})`);
			this.isBlinkingActive = true;
			this.startInterval(); // Assumes startInterval exists in api.js
			this.checkVariables(); // Update variables state
		} else if (!shouldBeBlinking && this.isBlinkingActive) {
			// Stop blinking
			this.log('debug', `Schedule check: Stopping blink (Active: ${shouldBeBlinking}, Currently Running: ${this.isBlinkingActive})`);
			this.isBlinkingActive = false;
			this.stopInterval(); // Assumes stopInterval exists in api.js
			this.boolValue = false; // Ensure visual state is off when stopped by schedule
			this.checkFeedbacks(); // Update buttons immediately
			this.checkVariables(); // Update variables state
		}
		// Implicitly: if shouldBeBlinking and isBlinkingActive are same, do nothing.
	}
}

runEntrypoint(GenericBlinkInstance, UpgradeScripts)