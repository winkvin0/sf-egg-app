const BLOCKQUOTE_STYLE = 'margin: 16px 0; padding: 10px 14px; border-left: 3px solid #1f7a4d; border-radius: 0 6px 6px 0; background: #f4fbf6; color: #435147;';
const BLOCKQUOTE_PARAGRAPH_STYLE = 'margin-top: 0; margin-bottom: 0;';
const HEADING_STYLES = {
    h1: 'display: block; margin: 0 0 12px; padding: 4px 0 2px; font-size: 26px; line-height: 1.35; font-weight: 700; color: #1c251f;',
    h2: 'display: block; margin: 18px 0 10px; padding: 3px 0 1px; font-size: 22px; line-height: 1.38; font-weight: 700; color: #1c251f;',
    h3: 'display: block; margin: 16px 0 8px; padding: 2px 0 1px; font-size: 19px; line-height: 1.42; font-weight: 700; color: #1c251f;',
};

export function processImgTags(htmlString) {
    if (typeof htmlString !== 'string') {
        return '';
    }

    return htmlString
        .replace(/<img([^>]*?)>/gi, (match, attributes) => {
            return `<img${mergeStyleAttribute(attributes, 'height: auto; max-width: 100%;')}>`;
        })
        .replace(/<(h[1-3])([^>]*)>/gi, (match, tagName, attributes) => {
            return `<${tagName}${mergeStyleAttribute(attributes, HEADING_STYLES[tagName.toLowerCase()])}>`;
        })
        .replace(/<blockquote([^>]*)>([\s\S]*?)<\/blockquote>/gi, (match, attributes, content) => {
            return `<blockquote${mergeStyleAttribute(attributes, BLOCKQUOTE_STYLE)}>${styleBlockquoteContent(content)}</blockquote>`;
        });
}

function styleBlockquoteContent(content) {
    return content.replace(/<p([^>]*)>/gi, (match, attributes) => {
        return `<p${mergeStyleAttribute(attributes, BLOCKQUOTE_PARAGRAPH_STYLE)}>`;
    });
}

function mergeStyleAttribute(attributes, styleToAppend) {
    const styleMatch = attributes.match(/style\s*=\s*["']([^"']*?)["']/i);

    if (!styleMatch) {
        return `${attributes} style="${styleToAppend}"`;
    }

    let style = styleMatch[1].trim();
    if (style && !style.endsWith(';')) {
        style += ';';
    }

    return attributes.replace(/style\s*=\s*["'][^"']*?["']/i, `style="${style} ${styleToAppend}"`);
}
