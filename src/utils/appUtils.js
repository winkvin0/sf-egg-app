import dayjs from "dayjs";

export function formatDate(value, format = 'YYYY-MM-DD', fallback = '--') {
    if (!value) {
        return fallback;
    }
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format(format) : fallback;
}

export function hideSystemTabBar() {
    uni.hideTabBar({
        animation: false,
        fail: () => {}
    })
}

export function switchTabIfNeeded(url, currentUrl) {
    if (url === currentUrl) {
        return;
    }
    uni.switchTab({url});
}
