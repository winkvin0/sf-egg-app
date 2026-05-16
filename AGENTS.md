# sf-egg-app Agent 指南

## 项目概况

这是盛菲蛋业的 uni-app 移动端应用。当前技术栈以 Vue 3、Vite、dayjs、Sass 和 uni-app 多端脚本为准；判断依赖时先看 `package.json` 和现有代码，不要默认存在额外 UI 或图表库。

核心路由配置在 `src/pages.json`：

- 首页：`src/pages/home/home.vue`、`company.vue`、`post-detail.vue`、`cooperation.vue`
- 蛋价：`src/pages/price/price.vue`、`trend.vue`
- 我的：`src/pages/my/my.vue`、`edit.vue`、`link.vue`

共享逻辑放在 `src/utils`；当前可复用组件包括 `src/components/app-safe-area/app-safe-area.vue`。

## API 与登录

- API 基地址通过 `src/utils/urlUtils.js` 读取 `import.meta.env.VITE_BASE_URL`。
- 环境文件是 `.env.development` 和 `.env.production`；不要把密码、密钥或真实凭据写进 `AGENTS.md`。
- 后端业务成功码是字符串 `00000`。
- 登录 token 存储键是 `satoken`；已登录请求通过 `Cookie` header 传递。
- 新增接口优先使用 `src/utils/httpUtils.js` 中的 `request`、`requestBusinessData`、`isSuccess`。
- 用户可感知的失败提示使用 `src/utils/toastUtils.js`；不要引用未定义的 `notify`。
- 登录、资料和缓存逻辑优先放在 `src/utils/authUtils.js`，除非任务明确需要调整边界。

## 编码规则

- 使用 Vue 3 `<script setup>`，沿用页面里已有的 Composition API 写法。
- 修改保持聚焦；避免引入全局 store、大范围重构或无关样式整理。
- 优先复用 `src/utils` 里的蛋价、登录、安全区、文件 URL、HTML、toast 和 tab 切换工具。
- 避免把生命周期钩子和宽泛 `watchEffect` 混用造成重复请求；优先写明确依赖的 `watch`。
- 搜索优先用 `rg`，手工改文件优先用 `apply_patch`。
- 不要删除或覆盖用户创建的未跟踪资源，尤其是 `src/static` 下的文件。

## UI 规则

- 这是运营型移动应用，不是营销落地页；优先保证信息密度、快速扫读和稳定流程。
- 蛋价和走势页面要先呈现关键报价，再展示次级信息。
- 保持自定义导航和安全区行为与 `app-safe-area` 以及现有 `navigationStyle: "custom"` 页面一致。
- 延续当前 redesign 方向：深绿色、蛋黄色高亮、暖色浅底、克制卡片。
- 布局要适配移动端宽度，不要按某个具体 iPhone 尺寸硬编码。
- 图表和表格要检查标签、数值、加载、空态、成功态和失败态的可读性。

## Figma

如果用户要求视觉重设计或较大的 UI 设计改动，先参考 Figma 再写生产代码：

- 文件：`https://www.figma.com/design/QIufwrAfkXJEQ6Ly9Dm73n`
- 名称：`sf-egg-app-redesign-mobile`

Figma 作为视觉方向，不要直接复制生成代码；实现时要适配 uni-app 和现有项目模式。

## 验证

- 小文案、文档、隔离样式或低风险工具函数改动，静态检查即可。
- 用户要求 devweixin 验证、改动涉及 UI/路由/平台/API/auth 风险，或静态检查不够时，运行 `npm run dev:mp-weixin`。
- 如果已有 `dev:mp-weixin` watcher 在运行，优先复用。
- 运行微信开发运行时时，实际可行的话在微信开发者工具里验证 UI 或运行效果。
- 除非用户明确要求，不要运行 H5 命令，包括 `npm run dev:h5`、`npm run build:h5`。
- 除非用户明确要求，不要运行 `npm run build:mp-weixin`。

## Git 与沟通

- `AGENTS.md` 可以加入 git；提交时只 stage 当前任务相关文件。
- 不要回滚用户改动，除非用户明确要求。
- 默认用中文解释和总结。
- 实现前简要说明会改什么；完成后说明改了哪些文件和做过的验证。
