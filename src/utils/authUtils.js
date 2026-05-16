import {reactive} from "vue";
import {baseUrl} from "./urlUtils";
import {isSuccess, parseCookie, request} from "./httpUtils";
import {showNoneToast} from "./toastUtils";
import {resolveBackendFileUrl} from "./fileUtils";

let wxAutoLoginPromise = null;
let authProfilePromise = null;
const defaultAvatar = "/static/default-avatar.svg";
const profileCacheKey = "sf_user_profile_cache";
const profileCacheTtl = 5 * 60 * 1000;

export const authState = reactive({
    loading: false,
    checked: false,
    tokenReady: false,
    user: null,
    authFailed: false,
    profileCachedAt: 0,
});

export function getSatoken() {
    return uni.getStorageSync('satoken');
}

export function hasSatoken() {
    return Boolean(getSatoken());
}

export function hydrateAuthProfileFromCache(options = {}) {
    if (!hasSatoken()) {
        return null;
    }
    const cache = readProfileCache(options);
    if (!cache) {
        return null;
    }
    applyUserProfile(cache.data, {
        cache: false,
        cachedAt: cache.cachedAt,
    });
    return authState.user;
}

export function isAuthProfileCacheExpired() {
    return !isProfileCacheFresh(authState.profileCachedAt);
}

export function hasBoundPhone(profile = authState.user) {
    if (!profile) {
        return false;
    }
    return Boolean(getProfilePhone(profile));
}

export function getProfilePhone(profile = authState.user) {
    if (!profile) {
        return '';
    }
    return profile.phone || profile.mobile || profile.phoneNumber || profile.mobilePhone || '';
}

export async function ensureAuthProfile(options = {}) {
    const {refresh = false} = options;
    if (!refresh) {
        if (authState.checked && (!authState.user || isProfileCacheFresh(authState.profileCachedAt))) {
            return buildAuthResult();
        }
        const cached = hydrateAuthProfileFromCache();
        if (cached) {
            return buildAuthResult();
        }
    }
    if (authProfilePromise) {
        return authProfilePromise;
    }
    authProfilePromise = bootstrapAuthProfile().finally(() => {
        authProfilePromise = null;
    });
    return authProfilePromise;
}

export function setGlobalUserProfile(profile) {
    applyUserProfile(profile);
}

async function bootstrapAuthProfile() {
    authState.loading = true;
    try {
        if (hasSatoken()) {
            const profileResult = await safeGetUserProfile();
            if (profileResult.profile) {
                setGlobalUserProfile(profileResult.profile);
                return buildAuthResult();
            }
            const cached = profileResult.requestFailed ? hydrateAuthProfileFromCache({allowExpired: true}) : null;
            if (cached) {
                return buildAuthResult();
            }
        }

        const logged = await ensureWxAutoLogin({force: hasSatoken()});
        if (!logged) {
            markAuthFailed();
            return {
                loggedIn: false,
                tokenReady: false,
                user: null,
            };
        }

        const profileResult = await safeGetUserProfile();
        authState.tokenReady = hasSatoken();
        authState.checked = true;
        authState.authFailed = false;
        if (profileResult.profile) {
            setGlobalUserProfile(profileResult.profile);
        } else {
            authState.user = null;
            authState.profileCachedAt = 0;
        }
        return buildAuthResult();
    } finally {
        authState.loading = false;
    }
}

async function safeGetUserProfile() {
    try {
        return {
            profile: await getUserProfile(),
            requestFailed: false,
        };
    } catch {
        return {
            profile: null,
            requestFailed: true,
        };
    }
}

async function getUserProfile() {
    const satoken = getSatoken();
    if (!satoken) {
        return null;
    }
    const profileRequest = {
        url: baseUrl + '/app/user/profile',
        method: 'GET',
        header: {
            'Cookie': 'satoken=' + satoken
        }
    };
    const resp = await request(profileRequest);
    if (!isSuccess(resp.data) || !resp.data.data) {
        return null;
    }
    return resp.data.data;
}

function normalizeProfile(profile) {
    if (!profile) {
        return null;
    }
    const localProfile = normalizeLocalProfile(uni.getStorageSync('sf_user_profile_draft') || {}, profile);
    return {
        ...profile,
        ...localProfile,
    };
}

function normalizeLocalProfile(profile, backendProfile = {}) {
    const {
        phoneBound,
        mobileBound,
        bindPhone,
        hasBindPhone,
        boundPhone,
        phone,
        mobile,
        phoneNumber,
        mobilePhone,
        ...localProfile
    } = profile;
    if (!localProfile.avatar || localProfile.avatar === defaultAvatar || backendProfile.avatar) {
        delete localProfile.avatar;
    } else {
        localProfile.avatar = resolveBackendFileUrl(localProfile.avatar);
    }
    return localProfile;
}

function readProfileCache(options = {}) {
    const {allowExpired = false} = options;
    const cache = uni.getStorageSync(profileCacheKey);
    if (!cache?.data || !cache.cachedAt) {
        return null;
    }
    if (!allowExpired && !isProfileCacheFresh(cache.cachedAt)) {
        return null;
    }
    return cache;
}

function writeProfileCache(profile) {
    const normalized = normalizeProfile(profile);
    if (!normalized) {
        return;
    }
    const cachedAt = Date.now();
    uni.setStorageSync(profileCacheKey, {
        data: normalized,
        cachedAt,
    });
    authState.profileCachedAt = cachedAt;
}

function applyUserProfile(profile, options = {}) {
    const {cache = true, cachedAt = Date.now()} = options;
    const normalized = normalizeProfile(profile);
    authState.user = normalized;
    authState.tokenReady = hasSatoken();
    authState.authFailed = false;
    authState.checked = true;
    authState.profileCachedAt = normalized ? cachedAt : 0;
    if (cache && normalized) {
        writeProfileCache(normalized);
    }
}

function isProfileCacheFresh(cachedAt) {
    return Boolean(cachedAt && Date.now() - Number(cachedAt) <= profileCacheTtl);
}

function buildAuthResult() {
    return {
        loggedIn: Boolean(authState.user),
        tokenReady: authState.tokenReady,
        user: authState.user,
    };
}

function markAuthFailed() {
    authState.user = null;
    authState.tokenReady = false;
    authState.authFailed = true;
    authState.checked = true;
    authState.profileCachedAt = 0;
}

export async function ensureWxAutoLogin(options = {}) {
    const {force = false, showToast = false} = options;
    if (!force && hasSatoken()) {
        return true;
    }
    if (wxAutoLoginPromise) {
        return wxAutoLoginPromise;
    }
    wxAutoLoginPromise = loginSilently(showToast).finally(() => {
        wxAutoLoginPromise = null;
    });
    return wxAutoLoginPromise;
}

async function loginSilently(showToast) {
    try {
        const code = await getWxLoginCode();
        return await doLogin(code, showToast);
    } catch {
        if (showToast) {
            showNoneToast('登录失败');
        }
        return false;
    }
}

function getWxLoginCode() {
    return new Promise((resolve, reject) => {
        uni.login({
            provider: 'weixin',
            timeout: 10000,
            success: (event) => {
                if (event.code) {
                    resolve(event.code);
                    return;
                }
                reject(event);
            },
            fail: reject,
        });
    });
}

async function doLogin(code, showToast) {
    const loginRequest = {
        url: baseUrl + '/wx/auth/login',
        method: 'POST',
        data: {
            code,
        },
    };
    try {
        const resp = await request(loginRequest);
        const cookie = parseCookie(resp.header['Set-Cookie']) || {};
        if (!isSuccess(resp.data) || !cookie['satoken']) {
            if (showToast) {
                showNoneToast('登录失败');
            }
            return false;
        }
        uni.setStorageSync('satoken', cookie['satoken']);
        return true;
    } catch {
        if (showToast) {
            showNoneToast('登录失败');
        }
        return false;
    }
}
