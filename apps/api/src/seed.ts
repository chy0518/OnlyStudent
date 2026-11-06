import { db } from "./db";
import { hashSync } from "bcryptjs";
export async function seed() {
  for (const [username, name, role] of [
    ["admin", "平台管理员", "ADMIN"],
    ["teacher", "林知夏老师", "TEACHER"],
    ["student", "陈同学", "STUDENT"],
  ])
    await db.user.upsert({
      where: { username },
      update: {},
      create: {
        id: username,
        username,
        name,
        role,
        password: hashSync("Demo123!", 10),
        balance: 50000,
        bio:
          role === "TEACHER"
            ? "把复杂的问题，讲得简单一点。"
            : "保持好奇，认真生长。",
      },
    });
  const courses = [
    ["math", "函数的世界：从直觉到解题", "数学", 9900],
    ["english", "让英语表达自然发生", "英语", 6900],
    ["physics", "生活里的物理实验室", "物理", 0],
    ["reading", "阅读，是看见更大的世界", "语文", 3900],
  ] as const;
  for (const [id, title, subject, price] of courses)
    await db.course.upsert({
      where: { id },
      update: {},
      create: {
        id,
        title,
        subject,
        price,
        teacherId: "teacher",
        description:
          "从真实的问题出发，一步一步建立知识框架。包含知识讲解、学习资料和课后练习，适合希望系统提升的你。",
      },
    });
  await db.schoolClass.upsert({
    where: { id: "demo-class" },
    update: {},
    create: {
      id: "demo-class",
      teacherId: "teacher",
      title: "高一数学 · 秋季进阶班",
      description: "每一次提问，都是进步的开始。一起把基础打扎实。",
      code: "LEARN2026",
    },
  });
  await db.member.upsert({
    where: { userId_classId: { userId: "student", classId: "demo-class" } },
    update: {},
    create: { userId: "student", classId: "demo-class" },
  });
  for (const a of [
    {
      id: "notice",
      kind: "NOTICE",
      title: "欢迎来到我们的学习空间",
      content: "本周学习函数的基本概念，请先阅读资料，再完成练习。",
      answer: "",
      options: [],
    },
    {
      id: "quiz",
      kind: "QUIZ",
      title: "热身练习：函数求值",
      content: "已知 f(x) = 2x + 1，那么 f(3) 等于多少？",
      options: ["5", "6", "7", "8"],
      answer: "7",
    },
    {
      id: "homework",
      kind: "ASSIGNMENT",
      title: "本周作业 · 身边的函数",
      content: "请举一个生活中的函数关系，说明自变量和因变量。",
      answer: "",
      options: [],
    },
  ])
    await db.activity.upsert({
      where: { id: a.id },
      update: {},
      create: { ...a, classId: "demo-class" },
    });
}
if (require.main === module) seed().finally(() => db.$disconnect());
