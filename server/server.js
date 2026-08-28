/**
 * 客户预览站点分发服务器
 *
 * 规则：
 *   - 每个客户在 sites/ 目录下拥有一个独立文件夹，文件夹名 = 子域名前缀
 *     例如 sites/wwairbnb/  对应  wwairbnb.你的域名.com
 *   - 访问时根据请求的 Host 头，取出最左侧的子域名前缀，
 *     去 sites/<前缀>/ 下查找并返回 index.html 等静态资源
 *   - 本地/无 DNS 场景下，也支持通过路径直接预览：
 *     http://服务器IP:端口/wwairbnb/  等价于访问 wwairbnb 客户站点
 *
 * 使用方法见根目录 README.md
 */

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8080;
const SITES_ROOT = path.join(__dirname, "..", "sites");

function getClientSlug(host) {
  if (!host) return null;
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");
  // 至少 3 段（sub.domain.tld）才认为带有客户子域名前缀
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

function clientDirExists(slug) {
  if (!slug || slug.startsWith("_") || slug.startsWith(".")) return false;
  const dir = path.join(SITES_ROOT, slug);
  return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
}

// 1) 优先按子域名分发（生产环境走这条路径）
app.use((req, res, next) => {
  const slug = getClientSlug(req.headers.host);
  if (slug && clientDirExists(slug)) {
    return express.static(path.join(SITES_ROOT, slug), { extensions: ["html"] })(req, res, next);
  }
  next();
});

// 2) 按路径前缀分发，方便本地 / 无 DNS 时直接预览： /wwairbnb/
app.use("/:slug", (req, res, next) => {
  const { slug } = req.params;
  if (clientDirExists(slug)) {
    return express.static(path.join(SITES_ROOT, slug), { extensions: ["html"] })(req, res, next);
  }
  next();
});

app.get("/", (req, res) => {
  const clients = fs
    .readdirSync(SITES_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
    .map((d) => d.name);

  res.type("html").send(`
    <h1>客户预览站点列表</h1>
    <ul>
      ${clients.map((c) => `<li><a href="/${c}/">${c}</a></li>`).join("\n")}
    </ul>
  `);
});

app.use((req, res) => {
  res.status(404).send("未找到该客户的预览站点，请检查文件夹是否已创建。");
});

app.listen(PORT, () => {
  console.log(`预览服务器已启动: http://localhost:${PORT}`);
  console.log(`静态站点根目录: ${SITES_ROOT}`);
});
