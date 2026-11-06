import assert from "node:assert/strict";
const base = process.env.API_URL || "http://localhost:3000/api";
async function call(path, token, body, method = body ? "POST" : "GET") {
  const r = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json() };
}
const login = async (username) => {
  const r = await call("/auth/login", null, { username, password: "Demo123!" });
  assert.equal(r.status, 201);
  return r.data.token;
};
assert.equal((await call("/me")).status, 401);
const s = await login("student"),
  t = await login("teacher");
assert.equal(
  (
    await call("/courses", s, {
      title: "illegal",
      description: "test",
      price: 0,
    })
  ).status,
  403,
);
assert.equal(
  (await call("/wallet/topup", s, { amount: -1, key: crypto.randomUUID() }))
    .status,
  400,
);
const before = (await call("/me", s)).data.balance;
assert.equal(
  (await call("/wallet/topup", s, { amount: 10000, key: crypto.randomUUID() }))
    .status,
  201,
);
assert.equal((await call("/me", s)).data.balance, before + 10000);
const c = (
  await call("/courses", t, {
    title: "Smoke course",
    description: "integration test",
    price: 100,
    subject: "数学",
  })
).data;
const results = await Promise.all([
  call(`/courses/${c.id}/enroll`, s, {}),
  call(`/courses/${c.id}/enroll`, s, {}),
]);
assert.ok(results.some((r) => r.status === 201));
assert.equal((await call("/me", s)).data.balance, before + 9900);
const cl = (
  await call("/classes", t, {
    title: "Smoke class",
    description: "integration",
  })
).data;
assert.equal((await call(`/classes/${cl.id}`, s)).status, 403);
assert.equal((await call("/classes/join", s, { code: cl.code })).status, 201);
const p = (
  await call(`/classes/${cl.id}/activities`, t, {
    kind: "QUIZ",
    title: "1+1?",
    content: "计算",
    options: ["1", "2"],
    answer: "2",
  })
).data;
const detail = (await call(`/classes/${cl.id}`, s)).data;
assert.equal(detail.activities.find((a) => a.id === p.id).answer, undefined);
assert.equal(
  (await call(`/activities/${p.id}/submit`, s, { content: "2" })).data.correct,
  true,
);
assert.equal((await call("/admin", s)).status, 403);
const key = crypto.randomUUID();
const initial = (await call("/me", s)).data.balance;
await Promise.all([
  call("/wallet/topup", s, { amount: 500, key }),
  call("/wallet/topup", s, { amount: 500, key }),
]);
assert.equal(
  (await call("/me", s)).data.balance,
  initial + 500,
  "repeated topup must credit only once",
);
const free = (
  await call("/courses", t, {
    title: "Free test",
    description: "free",
    price: 0,
  })
).data;
assert.equal((await call(`/courses/${free.id}/enroll`, s, {})).status, 201);
assert.equal((await call("/me", s)).data.balance, initial + 500);
const expensive = (
  await call("/courses", t, {
    title: "Expensive test",
    description: "insufficient balance",
    price: 10000000,
  })
).data;
assert.equal(
  (await call(`/courses/${expensive.id}/enroll`, s, {})).status,
  400,
);
const form = new FormData();
form.append("file", new Blob(["OnlyStudent file test"]), "lesson.txt");
form.append("courseId", c.id);
const up = await fetch(base + "/files", {
  method: "POST",
  headers: { Authorization: `Bearer ${t}` },
  body: form,
});
assert.equal(up.status, 201);
const file = await up.json();
const read = await fetch(base + "/files/" + file.id, {
  headers: { Authorization: `Bearer ${s}` },
});
assert.equal(await read.text(), "OnlyStudent file test");
const assignment = (
  await call(`/classes/${cl.id}/activities`, t, {
    kind: "ASSIGNMENT",
    title: "Homework",
    content: "Explain",
  })
).data;
assert.equal(
  (
    await call(`/activities/${assignment.id}/submit`, s, {
      content: "My answer",
    })
  ).status,
  201,
);
const admin = await login("admin");
assert.equal((await call("/admin", admin)).status, 200);
console.log(
  "PASS: authentication, roles, money validation, atomic purchase, membership and quiz privacy",
);
