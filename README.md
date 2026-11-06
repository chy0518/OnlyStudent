# OnlyStudent

React + NestJS 的本地教育平台 MVP。PostgreSQL 保存业务数据，Redis 缓存课程列表，MinIO 保存附件。

## 启动

安装并启动 Docker Desktop（Linux containers），在本目录执行：

```powershell
docker compose up -d --build
```

网站：http://localhost:5173 ，API 文档：http://localhost:3000/api/docs 。首次启动自动执行数据库迁移和幂等种子初始化。首次构建需要联网下载 npm、Docker 与 Go 依赖；后续启动复用镜像。

| 身份 | 账号 | 密码 |
| --- | --- | --- |
| 学生 | student | Demo123! |
| 教师 | teacher | Demo123! |
| 管理员 | admin | Demo123! |

演示班级邀请码：`LEARN2026`。每个演示账号初始余额 500 元。所有价格在数据库和 API 中以整数分表示。全部余额和充值均为模拟数据。

## 体验路径

界面支持课程关键词/教师搜索、学科与免费/付费组合筛选、价格排序、已加入标记；手机使用底部文字导航。登录页可快捷填入演示账号，课程请求失败可直接重试。界面回归命令：`npm run test:ui`（需要本机 Chrome 和已启动的网站）。

1. 学生登录：浏览网课、购买/免费加入、关注老师；进入班级答题、提交作业和附件；在“我的”充值和修改资料。
2. 退出并使用 teacher：发布/编辑课程、上传课程资料；创建班级、查看邀请码、发布公告/课次/选择题/作业；查看学生提交和附件。
3. admin 登录：进入管理概览查看汇总。

## 隔离与停止

项目名固定为 `onlystudent-mvp`，专属网络 `onlystudent-mvp-network`，数据卷以 `onlystudent-mvp_` 开头。仅网站与 API 映射到 `127.0.0.1`；数据库、Redis、MinIO 不映射宿主机端口。

```powershell
docker compose ps
docker compose logs --tail 100 api
docker compose stop
docker compose start
```

`stop` 和 `start` 保留数据。不要执行 `down -v`，除非希望永久清空本项目数据。不要使用全局 Docker prune。可复制 `.env.example` 为 `.env` 修改入口端口和本地凭据；重启已初始化数据库时不要随意更改数据库密码。

## 开发与验证

```powershell
npm install
npm run build
npm test
```

测试要求容器环境已启动，在演示账号下创建专属测试课程/班级并产生模拟流水，不清空现有数据。`API_URL` 可指定其他 API 地址。前端通过 Nginx 将 `/api` 代理到独立 NestJS 服务。Swagger 提供端点索引；请求字段参见 `apps/api/src/school.ts` 中的 Zod 校验。

## 范围与后续扩展

- 当前提供登录，不开放注册/找回密码；账号角色固定。
- 课程使用平铺资料列表，班级通过课次/公告/练习/作业组织；暂未制作多层课程章节编辑器、错题本或试听播放器。
- 资料通过鉴权 API 下载，最大 20 MB。视频可作为小型文件资料；没有转码、直播或 DRM。
- `apps/api/src/payments.ts` 定义支付提供者接口，模拟充值返回成功；课程购买用事务内余额扣款。真实支付上线时需补充支付回调签名验证、异步状态持久化、退款和对账。
- MinIO 官方社区版已转为源码发布，本项目从固定 tag `RELEASE.2025-10-15T17-29-55Z` 编译；详见 https://github.com/minio/minio 。
- 这是一套本地 MVP，默认演示密钥/账号不得直接用于公网部署。
- 依赖审计目前仍报告 11 项（10 high、1 moderate），涉及 Prisma 工具链、MinIO SDK 的传递依赖、Multer 和 Zod；兼容范围内的自动修复未解决，须在上线前安排版本迁移并重新验收。当前端口仅绑定本机。

## 本次验证结果

前后端 TypeScript/生产构建通过；真实接口验证覆盖角色权限、金额与余额、并发购课、充值幂等、班级访问、练习/作业和 MinIO 上传下载。Chrome 无头浏览器验证学生登录答题、教师名单及移动布局。整组 Docker 容器重启后余额与 MinIO 文件保持一致。独立静态审阅提出的名单、动态和跨班级作业附件访问问题已修复，并运行回归测试。

附加检查：`npm run test:browser`（需本机 Chrome）、`node tests/persistence.mjs`（重启本项目容器）、`node tests/attachment-regression.mjs`（创建测试教师）。测试数据不代表真实交易。
