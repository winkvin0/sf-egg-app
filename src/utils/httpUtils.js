import _ from 'lodash'

export const isSuccess = (res) => {
    return _.get(res, 'code', null) === '00000';
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
