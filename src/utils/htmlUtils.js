// 方法1：使用DOM解析（推荐）
export function processImgTags(htmlString) {
    return htmlString.replace(/<img([^>]*?)>/gi, (match, attributes) => {
        // 处理style属性
        let newAttributes = attributes;

        // 检查是否已有style属性
        const styleMatch = attributes.match(/style\s*=\s*["']([^"']*?)["']/i);

        if (styleMatch) {
            // 已有style属性，修改它
            let style = styleMatch[1];

            // 移除height属性
            style = style.replace(/height\s*:\s*[^;]+;?/gi, '');

            // 移除现有的max-width属性
            style = style.replace(/max-width\s*:\s*[^;]+;?/gi, '');

            // 添加新样式
            const newStyles = 'height: auto; max-width: 100%;';
            if (style.trim()) {
                if (!style.trim().endsWith(';')) {
                    style += ';';
                }
                style += ' ' + newStyles;
            } else {
                style = newStyles;
            }

            // 替换原有的style属性
            newAttributes = attributes.replace(/style\s*=\s*["'][^"']*?["']/i, `style="${style}"`);
        } else {
            // 没有style属性，添加一个
            newAttributes += ' style="height: auto; max-width: 100%;"';
        }

        return `<img${newAttributes}>`;
    });
}
