let throttleTimer: boolean = false;

export const throttle = (callback: () => void, time: number) => {
    if (throttleTimer) return;
    throttleTimer = true;
    setTimeout(() => {
        callback();
        throttleTimer = false;
    }, time);
};
