import { useEffect, useState, FormEvent } from "react";
import {
  Routes,
  Route,
  NavLink,
  Link,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  Home,
  BookOpen,
  Users,
  User,
  ArrowUpRight,
  ArrowRight,
  Plus,
  LogOut,
  GraduationCap,
  Play,
  Check,
  Wallet,
  FileText,
  Shield,
  Upload,
} from "lucide-react";
import { api, download } from "./api";
import CourseCatalog, { LoadError } from "./CourseCatalog";
type Data = Record<string, any>;
const money = (n: number) => "¥" + (n / 100).toFixed(2);
const roles: Data = { STUDENT: "学生", TEACHER: "教师", ADMIN: "管理员" };
const subjects: Data = {
  数学: "math",
  英语: "english",
  物理: "physics",
  语文: "reading",
};
function Cover({ course, large = false }: { course: Data; large?: boolean }) {
  return (
    <div
      className={`cover ${subjects[course.subject] || "math"} ${large ? "large" : ""}`}
    >
      <span className="cover-label">ONLYSTUDENT / {course.subject}</span>
      <div className="cover-art">
        {course.subject === "数学"
          ? "ƒ(x)"
          : course.subject === "英语"
            ? "Hello."
            : course.subject === "物理"
              ? "E = mc²"
              : "阅 · 见"}
      </div>
      <span className="cover-foot">
        发现知识的另一种可能 <ArrowUpRight size={16} />
      </span>
    </div>
  );
}
function Card({ course }: { course: Data }) {
  return (
    <Link className="course-card" to={"/courses/" + course.id}>
      {course.enrolled && (
        <span className="enrolled-badge">
          <Check size={13} />
          已加入
        </span>
      )}
      <Cover course={course} />
      <div className="card-body">
        <span className="tag">{course.subject}</span>
        <h3>{course.title}</h3>
        <p>
          {course.teacher?.name || "林知夏老师"} <span>· 系统精讲</span>
        </p>
        <div className="card-bottom">
          <strong>{course.price ? money(course.price) : "免费学习"}</strong>
          <span>
            {course.enrolled ? "已加入课程" : "探索课程"}{" "}
            <ArrowUpRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty">
      <BookOpen />
      <p>{children}</p>
    </div>
  );
}
export default function App() {
  const [user, setUser] = useState<Data | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [loginAccount, setLoginAccount] = useState("student");
  const location = useLocation();
  const refresh = () => api("/me").then(setUser);
  useEffect(() => {
    if (localStorage.getItem("token"))
      refresh()
        .catch(() => localStorage.removeItem("token"))
        .finally(() => setReady(true));
    else setReady(true);
  }, []);
  useEffect(() => {
    setError("");
    setNotice("");
  }, [location.pathname]);
  async function act(fn: () => Promise<any>, message = "操作成功") {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const shared = { user: user!, refresh, act, busy };
  if (!ready) return <div className="loading">正在打开学习空间…</div>;
  if (!user)
    return (
      <div className="login">
        <div className="login-story">
          <div className="brand">
            <GraduationCap /> onlystudent<span>学无止境</span>
          </div>
          <span className="eyebrow">A LITTLE EVERY DAY.</span>
          <h1>
            每一份好奇，
            <br />
            都值得被认真对待。
          </h1>
          <p>
            连接好老师，找到好课程。
            <br />
            让每一天的学习，都更近一步。
          </p>
          <div className="login-art">
            a² + b² = c² <span>✳</span>
          </div>
          <small>ONLYSTUDENT · 你的专属学习空间</small>
        </div>
        <div className="login-panel">
          <div className="login-box">
            <span className="tag">欢迎回来</span>
            <h2>开始今天的成长</h2>
            <p>登录后，为你开启专属的学习与教学空间。</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                act(async () => {
                  const r = await api("/auth/login", Object.fromEntries(f));
                  localStorage.setItem("token", r.token);
                  setUser(r.user);
                }, "登录成功");
              }}
            >
              <label>
                账号
                <input
                  name="username"
                  autoComplete="username"
                  value={loginAccount}
                  onChange={(e) => setLoginAccount(e.target.value)}
                  required
                />
              </label>
              <label>
                密码
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  defaultValue="Demo123!"
                  required
                />
              </label>
              {error && <div className="error">{error}</div>}
              <button disabled={busy} className="primary">
                进入学习空间 <ArrowRight size={18} />
              </button>
            </form>
            <div className="demo">
              <b>本地体验账号</b>
              <div className="demo-accounts">
                {[
                  ["student", "学生体验"],
                  ["teacher", "教师体验"],
                  ["admin", "管理员体验"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    aria-pressed={loginAccount === value}
                    onClick={() => setLoginAccount(value)}
                    disabled={busy}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <small>统一密码：Demo123!　余额及支付均为模拟</small>
            </div>
          </div>
        </div>
      </div>
    );
  return (
    <div className="shell">
      <aside>
        <Link to="/" className="brand">
          <GraduationCap size={30} /> onlystudent
        </Link>
        <div className="workspace-label">我的学习空间</div>
        <nav aria-label="主导航">
          {[
            [Home, "/", "首页"],
            [BookOpen, "/courses", "网课"],
            [Users, "/classes", "班级"],
            [User, "/me", "我的"],
            ...(user.role === "ADMIN" ? [[Shield, "/admin", "管理概览"]] : []),
          ].map(([Icon, path, label]: any) => (
            <NavLink aria-label={label} end={path === "/"} key={path} to={path}>
              <Icon size={20} />
              {label}
              <span aria-hidden="true">↗</span>
            </NavLink>
          ))}
        </nav>
        <div className="aside-note">
          <div>✳</div>
          <b>成长，不止于课堂</b>
          <p>
            保持好奇，慢慢积累。
            <br />
            你的下一次突破就在前方。
          </p>
        </div>
        <div className="account">
          <div className="avatar">{user.name.slice(0, 1)}</div>
          <div>
            <b>{user.name}</b>
            <small>{roles[user.role]}账号</small>
          </div>
        </div>
      </aside>
      <section className="main">
        <header>
          <span>
            一起学习，一起向前 <span className="muted">/ OnlyStudent</span>
          </span>
          <div className="header-account">
            <span className="role-chip">{roles[user.role]}空间</span>
            <div className="avatar small">{user.name.slice(0, 1)}</div>
            <button
              className="logout-button"
              title="退出登录"
              aria-label="退出登录"
              onClick={() => {
                localStorage.removeItem("token");
                setUser(null);
              }}
            >
              <LogOut size={17} />
              <span>退出</span>
            </button>
          </div>
        </header>
        <main>
          {error && (
            <div role="alert" className="error">
              {error}
              <button aria-label="关闭错误提示" onClick={() => setError("")}>
                ×
              </button>
            </div>
          )}
          {notice && (
            <div role="status" className="success">
              {notice}
              <button aria-label="关闭成功提示" onClick={() => setNotice("")}>
                ×
              </button>
            </div>
          )}
          <Routes>
            <Route path="/" element={<HomePage {...shared} />} />
            <Route path="/courses" element={<Courses {...shared} />} />
            <Route path="/courses/:id" element={<CourseDetail {...shared} />} />
            <Route path="/classes" element={<Classes {...shared} />} />
            <Route path="/classes/:id" element={<ClassDetail {...shared} />} />
            <Route path="/me" element={<Profile {...shared} />} />
            <Route path="/admin" element={<Admin />} />
            <Route
              path="*"
              element={<Empty>页面不存在，点击左侧导航继续。</Empty>}
            />
          </Routes>
          <footer>
            OnlyStudent <span>让学习连接更多可能</span>
            <span>LOCAL PREVIEW · 2026</span>
          </footer>
        </main>
      </section>
    </div>
  );
}
type Props = {
  user: Data;
  refresh: () => Promise<any>;
  act: (fn: () => Promise<any>, message?: string) => Promise<void>;
  busy: boolean;
};
function useData(path: string) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState("");
  const reload = () =>
    api(path)
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    setData(null);
    reload();
  }, [path]);
  return { data, reload, error };
}
function Title({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function HomePage({ user }: Props) {
  const { data: courses, error } = useData("/courses"),
    { data: classes } = useData("/classes"),
    { data: followed } = useData("/feed");
  return (
    <>
      <Title
        eyebrow="YOUR LEARNING JOURNEY"
        title={`${user.name}，今天也一起进步吧`}
        subtitle="把一点点好奇，变成看得见的成长。"
        action={<span className="date-chip">新的一天 · 新的收获</span>}
      />
      <div className="home-grid">
        <section className="hero">
          <div>
            <span className="hero-tag">探索你的下一种可能</span>
            <h2>
              好课程，让热爱
              <br />
              多走一步。
            </h2>
            <p>
              和优秀的老师一起，发现知识背后的乐趣。
              <br />
              从感兴趣的一节课开始。
            </p>
            <Link to="/courses" className="dark-btn">
              发现好课 <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="hero-illustration">
            <div className="orbit" />
            <div className="book book-back" />
            <div className="book book-front">
              <span>
                STAY
                <br />
                CURIOUS.
              </span>
              <small>ONLY STUDENT</small>
            </div>
            <div className="spark">✳</div>
            <div className="float-note">每天进步一点点 ↗</div>
          </div>
        </section>
        <section className="study-card">
          <div className="section-line">
            <b>我的学习</b>
            <BookOpen size={19} />
          </div>
          <div className="study-count">
            {courses?.filter((c: Data) => c.enrolled).length || 0}
            <span>门已加入课程</span>
          </div>
          <div className="stat-line">
            <span>所在班级</span>
            <b>{classes?.length || 0} 个</b>
          </div>
          <div className="stat-line">
            <span>当前身份</span>
            <b>{roles[user.role]}</b>
          </div>
          <Link to="/classes">
            进入我的班级 <ArrowRight size={17} />
          </Link>
        </section>
      </div>
      <div className="section-heading">
        <div>
          <h2>
            为你发现的好课 <span>EXPLORE</span>
          </h2>
          <p>不同的知识，相同的认真。</p>
        </div>
        <Link to="/courses">
          全部课程 <ArrowRight size={17} />
        </Link>
      </div>
      {error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="course-grid">
          {courses?.slice(0, 4).map((c: Data) => (
            <Card key={c.id} course={c} />
          ))}
        </div>
      )}
      <div className="section-heading">
        <div>
          <h2>我的学习动态</h2>
          <p>不错过每一次新的启发。</p>
        </div>
      </div>
      {followed?.length ? (
        <div className="activity-feed">
          {followed.slice(0, 3).map((c: Data) => (
            <Link key={c.id} to={c.path}>
              <div className="avatar">林</div>
              <div>
                <b>{c.label}</b>
                <p>{c.title}</p>
              </div>
              <ArrowUpRight />
            </Link>
          ))}
        </div>
      ) : (
        <div className="follow-empty">
          <Users size={26} />
          <div>
            <b>遇见喜欢的老师，记得关注</b>
            <p>在课程详情中关注老师，新课程会出现在这里。</p>
          </div>
          <Link to="/courses">去发现 →</Link>
        </div>
      )}
    </>
  );
}
function CourseForm({
  initial,
  onSave,
  busy,
}: {
  initial?: Data;
  onSave: (d: Data) => void;
  busy: boolean;
}) {
  return (
    <form
      className="panel form-grid"
      onSubmit={(e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.currentTarget));
        onSave({ ...f, price: Math.round(Number(f.price) * 100) });
      }}
    >
      <label>
        课程名称
        <input name="title" required defaultValue={initial?.title} />
      </label>
      <label>
        学科
        <select name="subject" defaultValue={initial?.subject}>
          {["数学", "英语", "物理", "语文", "通识"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <label>
        价格（元，0 为免费）
        <input
          name="price"
          type="number"
          min="0"
          max="100000"
          step="0.01"
          defaultValue={(initial?.price || 0) / 100}
          required
        />
      </label>
      <label className="wide">
        课程介绍
        <textarea
          name="description"
          required
          defaultValue={initial?.description}
        />
      </label>
      <button disabled={busy} className="primary">
        保存课程
      </button>
    </form>
  );
}
function Courses(p: Props) {
  const { data, reload, error } = useData("/courses");
  const [create, setCreate] = useState(false);
  return (
    <>
      <Title
        eyebrow="COURSE COLLECTION"
        title="好课，值得慢慢发现"
        subtitle="找到适合你的节奏，开启新的学习旅程。"
        action={
          p.user.role === "TEACHER" && (
            <button className="primary" onClick={() => setCreate(!create)}>
              <Plus size={18} />
              发布课程
            </button>
          )
        }
      />
      {create && (
        <CourseForm
          busy={p.busy}
          onSave={(d) =>
            p.act(async () => {
              await api("/courses", d);
              setCreate(false);
              await reload();
            }, "课程已发布")
          }
        />
      )}
      <CourseCatalog
        courses={data || []}
        userId={p.user.id}
        loading={!data}
        error={error}
        retry={reload}
        renderCard={(c) => <Card course={c} />}
      />
    </>
  );
}
function Files({ files, act }: { files: Data[]; act: Props["act"] }) {
  return (
    <div className="files">
      {files.map((f) => (
        <button
          key={f.id}
          onClick={() => act(() => download(f.id, f.name), "资料已下载")}
        >
          <FileText size={19} />
          {f.name}
          <span>下载 ↗</span>
        </button>
      ))}
    </div>
  );
}
function UploadFile({
  target,
  reload,
  p,
}: {
  target: Data;
  reload: () => Promise<any>;
  p: Props;
}) {
  return (
    <label className="upload">
      <Upload size={18} /> 上传资料（最多 20 MB）
      <input
        type="file"
        disabled={p.busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f)
            p.act(async () => {
              const body = new FormData();
              body.append("file", f);
              Object.entries(target).forEach(([k, v]) => body.append(k, v));
              await api("/files", body);
              await reload();
            }, "文件已上传");
          e.target.value = "";
        }}
      />
    </label>
  );
}
function CourseDetail(p: Props) {
  const { id } = useParams(),
    { data: c, reload, error } = useData("/courses/" + id);
  const [edit, setEdit] = useState(false);
  if (error) return <div className="error">{error}</div>;
  if (!c) return <Empty>正在加载课程…</Empty>;
  return (
    <>
      <Link className="back" to="/courses">
        ← 返回网课
      </Link>
      <div className="detail-grid">
        <Cover course={c} large />
        <section className="panel">
          <span className="tag">{c.subject} · 精品课程</span>
          <h1>{c.title}</h1>
          <p>{c.description}</p>
          <div className="teacher-line">
            <div className="avatar">{c.teacher?.name.slice(0, 1)}</div>
            <div>
              <b>{c.teacher?.name}</b>
              <small>{c.teacher?.bio}</small>
            </div>
            <button
              onClick={() =>
                p.act(
                  () => api(`/teachers/${c.teacherId}/follow`, {}),
                  "已关注老师",
                )
              }
            >
              关注 +
            </button>
          </div>
          <h2 className="price">{c.price ? money(c.price) : "免费学习"}</h2>
          {p.user.role === "STUDENT" && (
            <button
              className="primary"
              disabled={p.busy || c.enrolled}
              onClick={() =>
                p.act(async () => {
                  await api(`/courses/${id}/enroll`, {});
                  await reload();
                  await p.refresh();
                }, "已加入课程，可以开始学习了")
              }
            >
              <Play size={17} />
              {c.enrolled
                ? "已加入课程"
                : c.price
                  ? "余额购买 · 模拟支付"
                  : "免费加入课程"}
            </button>
          )}
          {c.teacherId === p.user.id && (
            <button onClick={() => setEdit(!edit)}>编辑课程</button>
          )}
        </section>
      </div>
      {edit && (
        <CourseForm
          initial={c}
          busy={p.busy}
          onSave={(d) =>
            p.act(async () => {
              await api("/courses/" + id, d, "PATCH");
              await reload();
              setEdit(false);
            })
          }
        />
      )}
      <section className="panel">
        <h2>课程学习资料</h2>
        {c.canAccess ? (
          <>
            <Files files={c.files} act={p.act} />
            {!c.files.length && <Empty>老师正在准备资料，敬请期待。</Empty>}
            {c.teacherId === p.user.id && (
              <UploadFile target={{ courseId: id }} reload={reload} p={p} />
            )}
          </>
        ) : (
          <Empty>加入课程后，即可查看并下载学习资料。</Empty>
        )}
      </section>
    </>
  );
}
function Classes(p: Props) {
  const { data, reload, error } = useData("/classes");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Title
        eyebrow="LEARNING TOGETHER"
        title={p.user.role === "TEACHER" ? "我的教学班级" : "我的班级"}
        subtitle="在一起，更有学习的力量。"
        action={
          p.user.role !== "ADMIN" && (
            <button
              className="primary"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <Plus size={18} />
              {p.user.role === "TEACHER" ? "创建班级" : "加入班级"}
            </button>
          )
        }
      />
      {open && (
        <form
          className="panel form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            const b = Object.fromEntries(new FormData(e.currentTarget));
            p.act(async () => {
              await api(
                p.user.role === "TEACHER" ? "/classes" : "/classes/join",
                b,
              );
              await reload();
              setOpen(false);
            }, "班级已更新");
          }}
        >
          {p.user.role === "TEACHER" ? (
            <>
              <label>
                班级名称
                <input name="title" required />
              </label>
              <label>
                班级介绍
                <input name="description" required />
              </label>
            </>
          ) : (
            <label>
              邀请码
              <input name="code" required placeholder="演示班级：LEARN2026" />
            </label>
          )}
          <button disabled={p.busy} className="primary">
            确认
          </button>
        </form>
      )}
      {error && <LoadError retry={reload} />}
      {!data && !error && (
        <div className="result-state" role="status">
          正在加载班级…
        </div>
      )}
      <div className="class-grid">
        {data?.map((c: Data) => (
          <Link className="class-card" to={"/classes/" + c.id} key={c.id}>
            <div className="class-banner">
              <Users size={32} />
              <span>一起向前 ↗</span>
            </div>
            <div className="card-body">
              <span className="tag">学习进行中</span>
              <h2>{c.title}</h2>
              <p>{c.description}</p>
              <div className="card-bottom">
                <span>公告 · 资料 · 练习 · 作业</span>
                <ArrowRight size={20} />
              </div>
            </div>
          </Link>
        ))}
      </div>
      {data?.length === 0 && (
        <div className="result-state">
          <div className="state-icon">
            <Users />
          </div>
          <h2>
            {p.user.role === "TEACHER"
              ? "创建你的第一个班级"
              : "学习，从加入班级开始"}
          </h2>
          <p>
            {p.user.role === "TEACHER"
              ? "把课程资料、练习和学生反馈集中在一起。"
              : "向老师获取邀请码，开启一起学习的旅程。"}
          </p>
          {p.user.role !== "ADMIN" && (
            <button className="primary" onClick={() => setOpen(true)}>
              {p.user.role === "TEACHER" ? "创建班级" : "输入邀请码"}
            </button>
          )}
        </div>
      )}
    </>
  );
}
function ClassDetail(p: Props) {
  const { id } = useParams(),
    { data: c, reload, error } = useData("/classes/" + id);
  const [tab, setTab] = useState("全部"),
    [open, setOpen] = useState(false);
  const teacher = c?.teacherId === p.user.id;
  const names: Data = {
    NOTICE: "公告",
    LESSON: "课次",
    QUIZ: "练习",
    ASSIGNMENT: "作业",
  };
  if (error) return <div className="error">{error}</div>;
  if (!c) return <Empty>正在加载班级…</Empty>;
  return (
    <>
      <Link className="back" to="/classes">
        ← 返回班级
      </Link>
      <Title
        eyebrow="YOUR CLASSROOM"
        title={c.title}
        subtitle={c.description}
        action={
          teacher && (
            <button className="primary" onClick={() => setOpen(!open)}>
              <Plus size={18} />
              发布教学内容
            </button>
          )
        }
      />
      <div className="class-meta">
        <span>
          <Users size={17} /> {c.memberCount} 位同学
        </span>
        {teacher && (
          <span>
            邀请码：<b>{c.code}</b>
          </span>
        )}
      </div>
      {open && (
        <form
          className="panel form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            const b = Object.fromEntries(new FormData(e.currentTarget));
            p.act(async () => {
              await api(`/classes/${id}/activities`, {
                ...b,
                options: String(b.options).split("\n").filter(Boolean),
              });
              await reload();
              setOpen(false);
            }, "教学内容已发布");
          }}
        >
          <label>
            类型
            <select name="kind">
              {Object.entries(names).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            标题
            <input name="title" required />
          </label>
          <label className="wide">
            内容
            <textarea name="content" required />
          </label>
          <label>
            选择题选项（每行一个）
            <textarea name="options" />
          </label>
          <label>
            正确答案（与选项一致）
            <input name="answer" />
          </label>
          <button className="primary" disabled={p.busy}>
            发布
          </button>
        </form>
      )}
      <div className="tabs spaced">
        {[
          "全部",
          "公告",
          "课次",
          "练习",
          "作业",
          "资料",
          ...(teacher ? ["学生名单", "学生提交"] : []),
        ].map((x) => (
          <button
            key={x}
            className={x === tab ? "selected" : ""}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </div>
      {tab === "资料" ? (
        <section className="panel">
          <Files files={c.files} act={p.act} />
          {!c.files.length && <Empty>暂无班级资料</Empty>}
          {teacher && (
            <UploadFile target={{ classId: id }} reload={reload} p={p} />
          )}
        </section>
      ) : tab === "学生名单" ? (
        <section className="panel">
          <h2>班级学生 · {c.memberCount} 人</h2>
          {c.members.map((m: Data) => (
            <div className="submission" key={m.id}>
              <b>{m.name}</b>
            </div>
          ))}
          {!c.members.length && (
            <Empty>还没有学生加入，分享邀请码邀请同学吧。</Empty>
          )}
        </section>
      ) : tab === "学生提交" ? (
        <section className="panel">
          <h2>学生学习记录</h2>
          {c.submissions.map((s: Data) => (
            <div className="submission" key={s.id}>
              <b>
                {c.members.find((m: Data) => m.id === s.userId)?.name || "同学"}{" "}
                · {c.activities.find((a: Data) => a.id === s.activityId)?.title}
              </b>
              <p>{s.content}</p>
              {s.correct !== null && (
                <span>{s.correct ? "回答正确" : "需要巩固"}</span>
              )}
              {s.fileId && (
                <button
                  onClick={() => p.act(() => download(s.fileId, "作业附件"))}
                >
                  下载作业附件
                </button>
              )}
            </div>
          ))}
          {!c.submissions.length && <Empty>还没有提交记录</Empty>}
        </section>
      ) : (
        c.activities
          .filter((a: Data) => tab === "全部" || names[a.kind] === tab)
          .map((a: Data) => (
            <section className="panel activity" key={a.id}>
              <span className="tag">{names[a.kind]}</span>
              <h2>{a.title}</h2>
              <p className="prewrap">{a.content}</p>
              {p.user.role === "STUDENT" &&
                ["QUIZ", "ASSIGNMENT"].includes(a.kind) && (
                  <SubmissionForm
                    a={a}
                    existing={c.submissions.find(
                      (s: Data) => s.activityId === a.id,
                    )}
                    p={p}
                    reload={reload}
                  />
                )}
            </section>
          ))
      )}
    </>
  );
}
function SubmissionForm({
  a,
  existing,
  p,
  reload,
}: {
  a: Data;
  existing?: Data;
  p: Props;
  reload: () => Promise<any>;
}) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <form
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const b = Object.fromEntries(new FormData(e.currentTarget));
        p.act(async () => {
          let fileId;
          if (file) {
            const form = new FormData();
            form.append("file", file);
            fileId = (await api("/files", form)).id;
          }
          await api(`/activities/${a.id}/submit`, {
            content: b.content,
            fileId,
          });
          await reload();
        }, "已提交");
      }}
    >
      {a.kind === "QUIZ" ? (
        <div className="quiz-options">
          {a.options.map((x: string) => (
            <label key={x}>
              <input
                type="radio"
                name="content"
                value={x}
                required
                defaultChecked={existing?.content === x}
              />
              {x}
            </label>
          ))}
        </div>
      ) : (
        <>
          <textarea
            name="content"
            placeholder="写下你的思考…"
            required
            defaultValue={existing?.content}
          />
          <label className="attachment">
            附件（可选，最多 20 MB）
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </>
      )}
      <div className="submit-row">
        <button disabled={p.busy} className="primary">
          {existing ? "更新提交" : "提交答案"}
        </button>
        {existing && (
          <span className="submitted">
            <Check size={16} />{" "}
            {existing.correct === null
              ? "作业已提交"
              : existing.correct
                ? "回答正确，继续保持！"
                : "已提交，再想一想吧"}
          </span>
        )}
      </div>
    </form>
  );
}
function Profile(p: Props) {
  const { data: transactions, reload } = useData("/wallet");
  return (
    <>
      <Title
        eyebrow="PERSONAL SPACE"
        title="我的，成长空间"
        subtitle="管理个人资料，记录每一次学习投入。"
      />
      <div className="profile-grid">
        <section className="panel">
          <div className="profile-title">
            <div className="avatar big">{p.user.name.slice(0, 1)}</div>
            <div>
              <h2>{p.user.name}</h2>
              <span className="tag">{roles[p.user.role]}</span>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const b = Object.fromEntries(new FormData(e.currentTarget));
              p.act(async () => {
                await api("/me", b, "PATCH");
                await p.refresh();
              }, "个人资料已保存");
            }}
          >
            <label>
              昵称
              <input name="name" required defaultValue={p.user.name} />
            </label>
            <label>
              个人简介
              <textarea name="bio" defaultValue={p.user.bio} />
            </label>
            <button disabled={p.busy} className="primary">
              保存资料
            </button>
          </form>
        </section>
        <section className="wallet-card">
          <Wallet />
          <p>我的学习余额</p>
          <h1>{money(p.user.balance)}</h1>
          <small>本地模拟余额 · 不涉及真实资金</small>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              p.act(async () => {
                await api("/wallet/topup", {
                  amount: Math.round(Number(f.get("amount")) * 100),
                  key: crypto.randomUUID(),
                });
                await p.refresh();
                await reload();
              }, "模拟充值成功");
            }}
          >
            <label>
              充值金额（元）
              <input
                name="amount"
                type="number"
                min="1"
                max="10000"
                defaultValue="100"
                required
              />
            </label>
            <button disabled={p.busy} className="dark-btn">
              模拟充值 <Plus size={17} />
            </button>
          </form>
        </section>
      </div>
      <section className="panel">
        <h2>最近订单与余额流水</h2>
        <div className="transaction-list">
          {transactions?.map((t: Data) => (
            <div key={t.id}>
              <div>
                <b>{t.kind === "TOPUP" ? "模拟充值" : "课程购买"}</b>
                <small>{new Date(t.createdAt).toLocaleString("zh-CN")}</small>
              </div>
              <code>{t.id.slice(-8)}</code>
              <strong className={t.amount > 0 ? "green" : ""}>
                {t.amount > 0 ? "+" : ""}
                {money(t.amount)}
              </strong>
            </div>
          ))}
        </div>
        {transactions?.length === 0 && <Empty>还没有流水记录</Empty>}
      </section>
    </>
  );
}
function Admin() {
  const { data, error } = useData("/admin");
  return (
    <>
      <Title
        eyebrow="ADMINISTRATION"
        title="平台管理概览"
        subtitle="查看本地演示环境的运行数据。"
      />
      {error && <div className="error">{error}</div>}
      <div className="admin-grid">
        {data &&
          Object.entries({
            users: "用户",
            courses: "课程",
            classes: "班级",
            orders: "课程订单",
          }).map(([k, v]) => (
            <section className="panel" key={k}>
              <p>{v}</p>
              <h1>{data[k]}</h1>
            </section>
          ))}
      </div>
    </>
  );
}
