import {baseUrl} from "./urlUtils";
import {getBusinessData, request} from "./httpUtils";

export const EGG_PRICE_REGIONS = [
    {name: '佛山', fullName: '广东佛山', code: '4406'},
    {name: '东莞', fullName: '广东东莞', code: '4419'},
    {name: '广州', fullName: '广东广州', code: '4401'},
];

export const DEFAULT_EGG_PRICE_SIZES = Array.from({length: 16}, (_, index) => 45 - index);

export function toSizeNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function toPriceNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function normalizeEggPrices(value) {
    return (Array.isArray(value) ? value : [])
        .map(item => ({
            ...item,
            size: toSizeNumber(item.size),
            pinkEggPrice: toPriceNumber(item.pinkEggPrice),
            redEggPrice: toPriceNumber(item.redEggPrice)
        }))
        .sort((a, b) => b.size - a.size);
}

export async function fetchEggPriceDetailAndLatest(params) {
    const [detailRes, latestRes] = await Promise.all([
        request({
            url: baseUrl + '/egg/price/detail',
            method: 'GET',
            data: params
        }),
        request({
            url: baseUrl + '/egg/price/latest',
            method: 'GET',
            data: params
        })
    ]);

    return {
        detailPrices: normalizeEggPrices(getBusinessData(detailRes, [])),
        latestPrices: normalizeEggPrices(getBusinessData(latestRes, []))
    };
}

export function buildEggPriceRows(detailPrices, latestPrices, options = {}) {
    const {
        includeReferenceOnly = false,
        missingReferenceDiff = 0,
        sizes = null
    } = options;
    const referencePriceMap = new Map(latestPrices.map(item => [item.size, item]));
    const basePrices = buildBasePrices(detailPrices, latestPrices, {
        includeReferenceOnly,
        sizes
    });

    return basePrices.map(item => {
        const referencePrice = referencePriceMap.get(item.size);
        const pinkEggPrice = toPriceNumber(item.pinkEggPrice);
        const redEggPrice = toPriceNumber(item.redEggPrice);

        return {
            ...item,
            pinkEggPrice,
            redEggPrice,
            pinkEggPriceDiff: referencePrice
                ? Number((pinkEggPrice - toPriceNumber(referencePrice.pinkEggPrice)).toFixed(2))
                : missingReferenceDiff,
            redEggPriceDiff: referencePrice
                ? Number((redEggPrice - toPriceNumber(referencePrice.redEggPrice)).toFixed(2))
                : missingReferenceDiff
        };
    });
}

function buildBasePrices(detailPrices, latestPrices, options) {
    const {includeReferenceOnly, sizes} = options;
    const detailPriceMap = new Map(detailPrices.map(item => [item.size, item]));

    if (Array.isArray(sizes) && sizes.length) {
        return sizes
            .map(toSizeNumber)
            .sort((a, b) => b - a)
            .map(size => detailPriceMap.get(size) || {size, pinkEggPrice: 0, redEggPrice: 0});
    }

    if (!includeReferenceOnly) {
        return detailPrices;
    }

    if (!detailPrices.length) {
        return [];
    }

    const sizeSet = new Set([
        ...detailPrices.map(item => item.size),
        ...latestPrices.map(item => item.size)
    ]);

    return Array.from(sizeSet)
        .sort((a, b) => b - a)
        .map(size => detailPriceMap.get(size) || {size, pinkEggPrice: 0, redEggPrice: 0});
}
