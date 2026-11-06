export const API = "/api";
export async function api(path: string, body?: unknown, method?: string) {
  const res = await fetch(API + path, {
    method: method || (body ? "POST" : "GET"),
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
    },
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: "请求失败" }));
    throw Error(data.message || "请求失败");
  }
  return res.json();
}
export async function download(id: string, name: string) {
  const r = await fetch(API + "/files/" + id, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (!r.ok) throw Error("无法下载资料");
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
