import {isSuccess} from "./httpUtils";
import {baseUrl} from "./urlUtils";

export function resolveBackendFileUrl(url) {
    if (!url) {
        return url;
    }
    if (/^(https?:|data:|blob:|wxfile:|http:\/\/tmp|https:\/\/tmp)/.test(url)) {
        return url;
    }
    if (url.startsWith('/file/')) {
        return baseUrl + url;
    }
    return url;
}

export function uploadImage(filePath) {
    return new Promise((resolve, reject) => {
        const satoken = uni.getStorageSync('satoken');
        uni.uploadFile({
            url: baseUrl + '/file/image',
            filePath,
            name: 'file',
            header: {
                'Cookie': 'satoken=' + satoken,
            },
            success: (res) => {
                const body = parseUploadBody(res.data);
                if (res.statusCode !== 200 || !isSuccess(body) || !body.data?.url) {
                    reject(res);
                    return;
                }
                resolve(body.data);
            },
            fail: reject,
        });
    });
}

function parseUploadBody(data) {
    if (!data) {
        return null;
    }
    if (typeof data === 'object') {
        return data;
    }
    try {
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
}
