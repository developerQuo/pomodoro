import { Observer } from "@/lib/observer";
import { MINUTE, SECOND } from "@/utils/times";
import wakeLock, { WakeLockSentinelType } from "./wakeLock";

export type ActionSchedule = "focus" | "shortBreaks" | "longBreaks";

export class Pomodoro {
    static DEFAULT_FOCUS_SESSION_DURATION = 25 * MINUTE;
    static DEFAULT_SHORT_BREAK_DURATION = 5 * MINUTE;
    static DEFAULT_LONG_BREAK_DURATION = 20 * MINUTE;

    // phase
    #cycle: number = 0;
    #focusCalledTimes: number = 0;
    #breakCalledTimes: number = 0;

    // time
    #timerId: NodeJS.Timeout | undefined;
    #remainingTime: number;

    // observer
    #remainingTimeObserver: Observer;
    #actionScheduleObserver: Observer;

    #wakeLockSentinel: WakeLockSentinelType = null;

    constructor(focusCalledTimes = 0, breakCalledTimes = 0) {
        this.#focusCalledTimes = focusCalledTimes;
        this.#breakCalledTimes = breakCalledTimes;

        this.#remainingTime = this.getDefaultDuration();
        this.#remainingTimeObserver = new Observer();
        this.#actionScheduleObserver = new Observer();
    }

    public onTimer(completeCallback: () => void) {
        if (this.#timerId) return; // prevent duplicate

        const nextActionTimer = () => {
            this.startTimer(this.getDefaultDuration(), () => {
                if (this.actionSchedule === "focus") {
                    startFocusTimer();
                } else if (this.actionSchedule === "shortBreaks") {
                    startShortBreakTimer();
                } else {
                    startLongBreakFocusTimer();
                }
            });
        };

        nextActionTimer();

        const thisInstance = this;
        function startFocusTimer() {
            thisInstance.#focusCalledTimes++;
            thisInstance.#actionScheduleObserver.notifyListeners();
            thisInstance.#timerId = undefined;
            thisInstance.alertCompletion();
            nextActionTimer();
        }
        function startShortBreakTimer() {
            thisInstance.#breakCalledTimes++;
            thisInstance.#actionScheduleObserver.notifyListeners();
            thisInstance.#timerId = undefined;
            thisInstance.alertCompletion();
            nextActionTimer();
        }
        function startLongBreakFocusTimer() {
            thisInstance.#cycle++;
            thisInstance.#actionScheduleObserver.notifyListeners();
            thisInstance.offTimer();
            thisInstance.alertCompletion();
            completeCallback();
        }
    }

    public startTimer(duration: number, timeoutCallback: Function) {
        // 남은 시간 세팅
        this.#remainingTime = duration;

        const secondTimer = () => {
            this.#timerId = setTimeout(() => {
                this.#remainingTime -= 1 * SECOND;
                this.#remainingTimeObserver.notifyListeners();

                if (this.#remainingTime > 0) {
                    secondTimer();
                } else {
                    timeoutCallback();
                }
            }, 1 * SECOND);
        };

        secondTimer();
    }

    private getDefaultDuration() {
        if (this.actionSchedule === "focus") {
            return Pomodoro.DEFAULT_FOCUS_SESSION_DURATION;
        } else if (this.actionSchedule === "shortBreaks") {
            return Pomodoro.DEFAULT_SHORT_BREAK_DURATION;
        } else {
            return Pomodoro.DEFAULT_LONG_BREAK_DURATION;
        }
    }

    public offTimer() {
        this.resetTimer();
        this.unLockScreenWithWake();
    }

    public resetTimer() {
        this.clearTimer();
        this.intializeCalledTimesDefaultValues();
    }

    private clearTimer() {
        this.#remainingTime = Pomodoro.DEFAULT_FOCUS_SESSION_DURATION;
        this.#remainingTimeObserver.notifyListeners();

        if (this.#timerId) {
            clearTimeout(this.#timerId);
            this.#timerId = undefined;
        }
    }

    private intializeCalledTimesDefaultValues() {
        this.#focusCalledTimes = 0;
        this.#breakCalledTimes = 0;
    }

    private alertCompletion() {
        // 벨소리
        const ringingBell = new Audio("sounds/bell.mp3");
        ringingBell.play();

        // 진동
        if ("vibrate" in navigator) {
            navigator.vibrate(200);
        }
    }

    public async lockScreenWithWake() {
        if (this.#wakeLockSentinel == null) {
            this.#wakeLockSentinel = await wakeLock();
        }
    }

    public async unLockScreenWithWake() {
        if (this.#wakeLockSentinel != null) {
            await this.#wakeLockSentinel.release();
            this.#wakeLockSentinel = null;
        }
    }

    get cycle() {
        return this.#cycle;
    }

    get focusCalledTimes() {
        return this.#focusCalledTimes;
    }

    get breakCalledTimes() {
        return this.#breakCalledTimes;
    }

    get actionSchedule(): ActionSchedule {
        if (!((this.#focusCalledTimes + this.#breakCalledTimes) % 2))
            return "focus";

        if (this.#breakCalledTimes < 3) return "shortBreaks";

        return "longBreaks";
    }

    get timerId() {
        return this.#timerId;
    }
    get remainingTime() {
        return this.#remainingTime;
    }

    get remainingTimeObserver(): Observer {
        return this.#remainingTimeObserver;
    }

    get actionScheduleObserver(): Observer {
        return this.#actionScheduleObserver;
    }

    get wakeLockSentinel() {
        return this.#wakeLockSentinel;
    }
}
