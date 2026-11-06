import { useState, type ReactNode } from "react";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  BookOpen,
  ArrowRight,
} from "lucide-react";

type Course = {
  id: string;
  title: string;
  subject: string;
  price: number;
  teacherId: string;
  enrolled?: boolean;
  teacher?: { name: string };
};
export function CourseSkeleton() {
  return (
    <div className="course-grid" aria-label="正在加载课程" role="status">
      {[0, 1, 2, 3].map((i) => (
        <div className="skeleton-card" key={i}>
          <div />
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
export function LoadError({ retry }: { retry: () => unknown }) {
  return (
    <div className="result-state" role="alert">
      <div className="state-icon">
        <RotateCcw />
      </div>
      <h2>暂时无法加载</h2>
      <p>请检查网络连接，然后再试一次。</p>
      <button onClick={retry} className="primary">
        重新加载
      </button>
    </div>
  );
}
export default function CourseCatalog({
  courses,
  userId,
  loading,
  error,
  retry,
  renderCard,
}: {
  courses: Course[];
  userId: string;
  loading: boolean;
  error: string;
  retry: () => unknown;
  renderCard: (c: Course) => ReactNode;
}) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("全部课程"),
    [subject, setSubject] = useState("全部学科"),
    [sort, setSort] = useState("newest");
  const subjects = ["全部学科", ...new Set(courses.map((c) => c.subject))];
  const term = query.trim().toLocaleLowerCase();
  const visible = courses.filter(
    (c) =>
      (!term ||
        [c.title, c.subject, c.teacher?.name || ""].some((v) =>
          v.toLocaleLowerCase().includes(term),
        )) &&
      (subject === "全部学科" || c.subject === subject) &&
      (category === "全部课程" ||
        (category === "免费课程" && c.price === 0) ||
        (category === "付费课程" && c.price > 0) ||
        (category === "我的课程" && (c.enrolled || c.teacherId === userId))),
  );
  if (sort !== "newest")
    visible.sort((a, b) =>
      sort === "price-asc" ? a.price - b.price : b.price - a.price,
    );
  const reset = () => {
    setQuery("");
    setCategory("全部课程");
    setSubject("全部学科");
    setSort("newest");
  };
  const filtered = !!query || category !== "全部课程" || subject !== "全部学科";
  return (
    <>
      <section className="catalog-controls" aria-label="筛选课程">
        <div className="catalog-top">
          <div className="tabs">
            {["全部课程", "免费课程", "付费课程", "我的课程"].map((x) => (
              <button
                key={x}
                aria-pressed={category === x}
                className={category === x ? "selected" : ""}
                onClick={() => setCategory(x)}
              >
                {x}
              </button>
            ))}
          </div>
          <label className="catalog-search">
            <Search size={19} />
            <input
              aria-label="搜索课程或老师"
              placeholder="搜索你感兴趣的课程"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button aria-label="清空搜索" onClick={() => setQuery("")}>
                ×
              </button>
            )}
          </label>
        </div>
        <div className="subject-row">
          <span>
            <SlidersHorizontal size={15} />
            学科
          </span>
          <div>
            {subjects.map((x) => (
              <button
                key={x}
                aria-pressed={subject === x}
                className={subject === x ? "chosen" : ""}
                onClick={() => setSubject(x)}
              >
                {x}
              </button>
            ))}
          </div>
        </div>
      </section>
      {error ? (
        <LoadError retry={retry} />
      ) : loading ? (
        <CourseSkeleton />
      ) : (
        <>
          <div className="catalog-results">
            <p aria-live="polite">
              共 <strong>{visible.length}</strong> 门课程
              {filtered && <button onClick={reset}>清除筛选</button>}
            </p>
            <label>
              排序
              <select
                aria-label="课程排序"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest">最新发布</option>
                <option value="price-asc">价格从低到高</option>
                <option value="price-desc">价格从高到低</option>
              </select>
            </label>
          </div>
          {visible.length ? (
            <div className="course-grid">
              {visible.map((c) => (
                <div className="catalog-card-wrap" key={c.id}>
                  {renderCard(c)}
                </div>
              ))}
            </div>
          ) : (
            <div className="result-state">
              <div className="state-icon">
                <BookOpen />
              </div>
              <h2>{filtered ? "没有找到相关课程" : "好课程，即将相见"}</h2>
              <p>
                {filtered
                  ? "换一个关键词，或清除筛选看看其他课程。"
                  : "老师发布课程后，就会展示在这里。"}
              </p>
              {filtered && (
                <button className="primary" onClick={reset}>
                  查看全部课程 <ArrowRight size={16} />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
