import {resolveBackendFileUrl} from "./fileUtils";

export const SHARE_IMAGES = {
    home: '/static/share-home.png',
    company: '/static/share-company.png',
    post: '/static/share-post.png',
    cooperation: '/static/share-cooperation.png',
    price: '/static/share-price.png',
    trend: '/static/share-trend.png',
};

export function normalizeShareTitle(value, fallback) {
    const title = String(value || '').trim();
    return title || fallback;
}

export function buildPostSharePath(id) {
    return id ? `/pages/home/post-detail?id=${encodeURIComponent(id)}` : '/pages/home/home';
}

export function resolveShareImage(value, fallback) {
    return resolveBackendFileUrl(value) || fallback;
}
