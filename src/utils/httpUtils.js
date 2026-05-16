export const isSuccess = (res) => {
    return get(res, 'code', null) === '00000';
}

export const getBusinessData = (response, fallback = null) => {
    const body = get(response, 'data', null);
    if (get(response, 'statusCode') !== 200 || !isSuccess(body)) {
        return fallback;
    }
    return get(body, 'data', fallback);
}

export async function requestBusinessData(config, fallback = null) {
    try {
        const response = await request(config);
        return getBusinessData(response, fallback);
    } catch (error) {
        return fallback;
    }
}

function get(source, path, fallback = undefined) {
    const value = String(path)
        .split('.')
        .reduce((current, key) => current == null ? undefined : current[key], source);
    return value === undefined ? fallback : value;
}

export function parseCookie(cookieString) {
    if (!cookieString) {
        return;
    }
    const cookies = {};
    const parts = cookieString.split(';');

    parts.forEach(part => {
        const trimmed = part.trim();
        const [key, value] = trimmed.split('=');
        if (key && value) {
            cookies[key] = value;
        }
    });

    return cookies;
}


export function request(config) {
    return new Promise((resolve, reject) => {
        uni.request({
            ...config,
            success: (res) => {
                resolve(res);
            },
            fail: (err) => {
                reject(err);
            }
        })
    })
}
