export function getWindowInfoSafe() {
  if (typeof uni.getWindowInfo === 'function') {
    try {
      return uni.getWindowInfo() || {};
    } catch (error) {
      return {};
    }
  }

  if (typeof uni.getSystemInfoSync === 'function') {
    try {
      return uni.getSystemInfoSync() || {};
    } catch (error) {
      return {};
    }
  }

  return {};
}

export function getWindowHeight(fallback = 667) {
  return Number(getWindowInfoSafe().windowHeight) || fallback;
}

export function getWindowWidth(fallback = 375) {
  return Number(getWindowInfoSafe().windowWidth) || fallback;
}

export function getDevicePixelRatio(fallback = 1) {
  const windowInfo = getWindowInfoSafe();
  if (Number(windowInfo.pixelRatio)) {
    return Number(windowInfo.pixelRatio);
  }

  if (typeof uni.getDeviceInfo === 'function') {
    try {
      return Number(uni.getDeviceInfo()?.pixelRatio) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  return fallback;
}

export function getSafeTopHeight(offset = 8) {
  const windowInfo = getWindowInfoSafe();
  const statusBarHeight = Number(windowInfo.statusBarHeight) || 0;
  let topHeight = statusBarHeight + offset;

  if (typeof uni.getMenuButtonBoundingClientRect === 'function') {
    try {
      const menuButton = uni.getMenuButtonBoundingClientRect();
      if (menuButton && Number(menuButton.bottom) > 0) {
        topHeight = Number(menuButton.bottom) + offset;
      }
    } catch (error) {
      topHeight = statusBarHeight + offset;
    }
  }

  return topHeight;
}
