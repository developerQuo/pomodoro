export function timerStart(duration: number, timeoutCallback: Function) {
	return setTimeout(() => {
		timeoutCallback();
	}, duration);
}
const SECOND = 1 * 1000;
const MINUTE = 60 * SECOND;

export class Pomodoro {
	public cycle: number;
	public focusCalledTimes: number;
	public breakCalledTimes: number;

	private focusSessionDuration = 25 * MINUTE;
	private shortBreakDuration = 5 * MINUTE;
	private longBreakDuration = 20 * MINUTE;

	private timerId: NodeJS.Timeout | undefined;

	constructor() {
		this.cycle = 0;
		this.focusCalledTimes = 0;
		this.breakCalledTimes = 0;
	}

	public onTimer() {
		const timeToFocus = !((this.focusCalledTimes + this.breakCalledTimes) % 2);

		if (timeToFocus) {
			this.timerId = timerStart(this.focusSessionDuration, () => {
				this.focusCalledTimes++;
				this.onTimer();
			});
		} else {
			if (this.breakCalledTimes < 3) {
				this.timerId = timerStart(this.shortBreakDuration, () => {
					this.breakCalledTimes++;
					this.onTimer();
				});
			} else {
				this.timerId = timerStart(this.longBreakDuration, () => {
					this.cycle++;
					this.focusCalledTimes = 0;
					this.breakCalledTimes = 0;
				});
			}
		}
	}

	public offTimer() {
		if (this.timerId) {
			clearTimeout(this.timerId);
			this.timerId = undefined;
		}

		this.cycle = 0;
		this.focusCalledTimes = 0;
		this.breakCalledTimes = 0;
	}

	public resetTimer() {
		if (this.timerId) {
			clearTimeout(this.timerId);
			this.timerId = undefined;
		}

		this.focusCalledTimes = 0;
		this.breakCalledTimes = 0;
	}

	get getCycle() {
		return this.cycle;
	}

	get getFocusCalledTimes() {
		return this.focusCalledTimes;
	}

	get getBreakCalledTimes() {
		return this.breakCalledTimes;
	}

	get getTimerId() {
		return this.timerId;
	}
}
