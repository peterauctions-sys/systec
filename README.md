# systec - 客户预览站点

本仓库用于给不同客户做 **HTML 预览**：每个客户一个独立文件夹，文件夹名即为该客户的子域名前缀，例如：

```
sites/wwairbnb/   →  wwairbnb.你的域名.com
```

## 目录结构

```
sites/
  _template/        # 新客户文件夹模板（复制它来新建客户）
  wwairbnb/          # 客户「wwairbnb」的预览站点
    index.html
    (其他 css/js/images 等资源文件)
server/
  server.js          # 按子域名 / 路径分发静态文件的 Node 服务
  package.json
nginx/
  client-preview.conf.example   # 生产环境通配子域名的 Nginx 示例配置
```

## 如何上传 HTML（给客户 wwairbnb 使用）

1. 把客户提供的 `index.html`（以及它依赖的 css / js /图片等文件）直接放进：

   ```
   sites/wwairbnb/
   ```

   直接覆盖里面的占位 `index.html` 即可，文件夹结构和路径引用关系保持不变。

2. 上传方式任选其一：
   - **Git 方式（推荐）**：把文件拷到本地仓库的 `sites/wwairbnb/` 目录下，然后
     ```bash
     git add sites/wwairbnb
     git commit -m "更新 wwairbnb 预览页面"
     git push
     ```
   - **直接上传到服务器**：用 `scp` / `sftp` / 面板文件管理器等方式，把文件上传到服务器上本仓库对应的 `sites/wwairbnb/` 目录。

3. 上传完成后即可通过对应的子域名（或下面的本地路径方式）直接访问，无需重启服务、无需额外配置——只要文件夹里有 `index.html`，`server/server.js` 会自动识别。

## 新增其他客户

1. 复制 `sites/_template/` 文件夹，重命名为新客户的子域名前缀（例如 `sites/clientb/`）。
2. 把该客户的 `index.html` 等文件放进新文件夹。
3. 完成，不需要改任何代码或配置。

## 本地快速预览（不需要域名/DNS）

```bash
cd server
npm install
npm start
```

启动后：
- 访问 `http://localhost:8080/` 可以看到所有客户站点的列表
- 访问 `http://localhost:8080/wwairbnb/` 即可预览 wwairbnb 客户的页面

## 正式环境：给每个客户配置独立子域名

1. 域名解析（DNS）：在你的域名服务商添加一条 **泛解析（通配符）A 记录**：

   | 类型 | 主机记录 | 记录值 |
   |------|---------|--------|
   | A    | *       | 服务器公网 IP |

   这样 `wwairbnb.你的域名.com`、以后新增的任何 `客户名.你的域名.com` 都会自动指向这台服务器，**不需要每加一个客户就去改一次 DNS**。

2. 在服务器上启动预览服务（建议用 pm2 保活）：

   ```bash
   cd server
   npm install
   npm install -g pm2   # 如果还没装
   pm2 start server.js --name client-preview
   ```

3. 参考 `nginx/client-preview.conf.example` 配置 Nginx，把 `*.你的域名.com` 的请求反向代理到本地的 `server.js`（默认端口 8080）。`server.js` 会自动根据请求的域名前缀（如 `wwairbnb`）去 `sites/wwairbnb/` 下取文件返回。

4. （可选）用 certbot 申请通配符 HTTPS 证书 `*.你的域名.com`，参考配置文件里注释掉的 HTTPS server 块启用。

完成以上配置后：**以后每新增一个客户，只需要在 `sites/` 下新建一个以客户名命名的文件夹并放入其 HTML 即可，对应的 `客户名.你的域名.com` 会立刻可以访问，不需要再改服务器配置。**
