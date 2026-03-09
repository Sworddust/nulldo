# null.do prototype

一个极简、会呼吸的单页面原型。

## 功能

- 左上角：根据访问者 IP 估算位置，获取当地日出 / 日落时间
- 白天：显示太阳进度小动画
- 夜晚：切换为月相小动画
- 中间：每天变化的一句话
- 右下角：本地时间
- 背景：轻柔渐变 + 呼吸感 + 微弱漂浮层

## 本地预览

### 方式 1：直接起静态服务

```bash
cd prototypes/null-do
python3 -m http.server 8787
```

打开：

```text
http://127.0.0.1:8787
```

> 建议通过 http 访问，不要直接双击 `index.html` 用 `file://` 打开；
> 因为页面里有定位和日出日落 API 请求，部分浏览器会限制。

---

## 部署到 Vercel

### 方法 A：网页上传

1. 打开 <https://vercel.com/new>
2. 选择 **Import / Upload**
3. 上传 `prototypes/null-do` 整个目录
4. Framework 选择 **Other**
5. 保持默认，直接部署

### 方法 B：CLI

```bash
npm i -g vercel
cd prototypes/null-do
vercel
```

首次部署按提示走即可。

---

## 部署到 Cloudflare Pages

1. 登录 Cloudflare
2. Pages -> Create a project -> Direct Upload
3. 上传 `prototypes/null-do` 目录内容
4. 不需要构建命令
5. Output directory 留空或填 `.`

---

## 绑定 `null.do`

无论是 Vercel 还是 Cloudflare Pages，部署完成后：

1. 到对应平台添加自定义域名 `null.do`
2. 按平台提示去域名 DNS 配置：
   - Vercel 通常是加 A / CNAME
   - Cloudflare Pages 通常直接接管 DNS 更方便
3. 等待证书签发完成即可

---

## 可继续优化的方向

- 增加更细腻的文案库（30 / 90 / 365 条）
- 背景颜色按日出、白天、黄昏、深夜更自然过渡
- 音乐 / 环境音开关
- 节气 / 星期联动文案
- 更精细的移动端间距和动画参数

---

## 文件结构

```text
prototypes/null-do/
├── index.html
├── style.css
├── app.js
├── content.js
├── vercel.json
└── README.md
```
