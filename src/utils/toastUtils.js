export const DEFAULT_TOAST_DURATION = 2500;

export function showToast(options) {
    uni.showToast({
        duration: DEFAULT_TOAST_DURATION,
        ...options,
    });
}

export function showNoneToast(title, options = {}) {
    showToast({
        icon: 'none',
        title,
        ...options,
    });
}

export function showSuccessToast(title, options = {}) {
    showToast({
        icon: 'success',
        title,
        ...options,
    });
}
