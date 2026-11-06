import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { Client } from "minio";
import { createClient } from "redis";
import { db } from "./db";
import { AuthGuard, role, safeUser } from "./auth";
import { MockPaymentProvider } from "./payments";
const text = z.string().trim().min(1).max(10000);
const courseSchema = z.object({
  title: text.max(150),
  description: text,
  subject: text.max(40).default("通识"),
  price: z.number().int().min(0).max(10000000),
});
export function parse<S extends z.ZodTypeAny>(
  schema: S,
  body: unknown,
): z.output<S> {
  const result = schema.safeParse(body);
  if (!result.success)
    throw new BadRequestException(
      result.error.issues.map((x) => x.message).join("；"),
    );
  return result.data;
}
export const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
redis.on("error", () => {});
export const minio = new Client({
  endPoint: process.env.MINIO_HOST || "localhost",
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_USER || "onlystudent",
  secretKey: process.env.MINIO_PASSWORD || "onlystudent-local-secret",
});
export const bucket = "onlystudent-mvp-files";
export async function classAccess(id: string, u: any) {
  const c = await db.schoolClass.findUnique({ where: { id } });
  if (!c) throw new NotFoundException("班级不存在");
  if (
    c.teacherId !== u.id &&
    u.role !== "ADMIN" &&
    !(await db.member.findUnique({
      where: { userId_classId: { userId: u.id, classId: id } },
    }))
  )
    throw new ForbiddenException("请先加入班级");
  return c;
}
async function teacherClass(id: string, u: any) {
  role(u, "TEACHER");
  const c = await classAccess(id, u);
  if (c.teacherId !== u.id) throw new ForbiddenException();
  return c;
}
@Controller()
@UseGuards(AuthGuard)
export class SchoolController {
  @Get("me") me(@Req() r: any) {
    return safeUser(r.user);
  }
  @Patch("me") async profile(@Req() r: any, @Body() b: any) {
    return safeUser(
      await db.user.update({
        where: { id: r.user.id },
        data: parse(
          z.object({ name: text.max(60), bio: z.string().max(500) }),
          b,
        ),
      }),
    );
  }
  @Get("courses") async courses(@Req() r: any) {
    let cached = await redis.get("courses");
    let courses = cached
      ? JSON.parse(cached)
      : await db.course.findMany({ orderBy: { createdAt: "desc" } });
    if (!cached)
      await redis.set("courses", JSON.stringify(courses), { EX: 30 });
    const owned = await db.enrollment.findMany({
      where: { userId: r.user.id },
    });
    const teachers = await db.user.findMany({
      where: { role: "TEACHER" },
      select: { id: true, name: true, bio: true },
    });
    return courses.map((c: any) => ({
      ...c,
      teacher: teachers.find((t) => t.id === c.teacherId),
      enrolled: owned.some((e) => e.courseId === c.id),
    }));
  }
  @Post("courses") async createCourse(@Req() r: any, @Body() b: any) {
    role(r.user, "TEACHER");
    const c = await db.course.create({
      data: { ...parse(courseSchema, b), teacherId: r.user.id },
    });
    await redis.del("courses");
    return c;
  }
  @Patch("courses/:id") async editCourse(
    @Req() r: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    role(r.user, "TEACHER");
    const c = await db.course.findUnique({ where: { id } });
    if (c?.teacherId !== r.user.id) throw new ForbiddenException();
    const result = await db.course.update({
      where: { id },
      data: parse(courseSchema, b),
    });
    await redis.del("courses");
    return result;
  }
  @Get("courses/:id") async course(@Req() r: any, @Param("id") id: string) {
    const c = await db.course.findUnique({ where: { id } });
    if (!c) throw new NotFoundException();
    const owned = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: r.user.id, courseId: id } },
    });
    const access =
      !!owned || c.teacherId === r.user.id || r.user.role === "ADMIN";
    return {
      ...c,
      enrolled: !!owned,
      teacher: await db.user.findUnique({
        where: { id: c.teacherId },
        select: { id: true, name: true, bio: true },
      }),
      files: access
        ? await db.storedFile.findMany({ where: { courseId: id } })
        : [],
      canAccess: access,
    };
  }
  @Post("courses/:id/enroll") async enroll(
    @Req() r: any,
    @Param("id") id: string,
  ) {
    role(r.user, "STUDENT");
    return db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${r.user.id} FOR UPDATE`;
      const c = await tx.course.findUnique({ where: { id } });
      if (!c) throw new NotFoundException();
      const existing = await tx.enrollment.findUnique({
        where: { userId_courseId: { userId: r.user.id, courseId: id } },
      });
      if (existing) return existing;
      const u = await tx.user.findUniqueOrThrow({ where: { id: r.user.id } });
      if (u.balance < c.price)
        throw new BadRequestException("余额不足，请先模拟充值");
      await tx.user.update({
        where: { id: u.id },
        data: { balance: { decrement: c.price } },
      });
      await tx.transaction.create({
        data: {
          userId: u.id,
          amount: -c.price,
          kind: "PURCHASE",
          courseId: id,
          key: `purchase:${u.id}:${id}`,
        },
      });
      return tx.enrollment.create({ data: { userId: u.id, courseId: id } });
    });
  }
  @Get("wallet") wallet(@Req() r: any) {
    return db.transaction.findMany({
      where: { userId: r.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
  @Post("wallet/topup") async topup(@Req() r: any, @Body() b: any) {
    const { amount, key } = parse(
      z.object({
        amount: z.number().int().positive().max(1000000),
        key: z.string().uuid(),
      }),
      b,
    );
    return db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${r.user.id} FOR UPDATE`;
      const existing = await tx.transaction.findUnique({ where: { key } });
      if (existing) {
        if (existing.userId !== r.user.id || existing.amount !== amount)
          throw new BadRequestException("充值请求不匹配");
        return existing;
      }
      await new MockPaymentProvider().createPayment(key, amount);
      await tx.user.update({
        where: { id: r.user.id },
        data: { balance: { increment: amount } },
      });
      return tx.transaction.create({
        data: { userId: r.user.id, amount, kind: "TOPUP", key },
      });
    });
  }
  @Get("follows") follows(@Req() r: any) {
    return db.follow.findMany({ where: { userId: r.user.id } });
  }
  @Get("feed") async feed(@Req() r: any) {
    const follows = await db.follow.findMany({where:{userId:r.user.id}});
    const enrollments = await db.enrollment.findMany({where:{userId:r.user.id}});
    const members = await db.member.findMany({where:{userId:r.user.id}});
    const classes = await db.schoolClass.findMany({where:{OR:[{teacherId:r.user.id},{id:{in:members.map(m=>m.classId)}}]}});
    const courses = await db.course.findMany({where:{OR:[{teacherId:{in:follows.map(f=>f.teacherId)}},{id:{in:enrollments.map(e=>e.courseId)}}]},orderBy:{createdAt:'desc'},take:10});
    const announcements=await db.activity.findMany({where:{kind:'NOTICE',classId:{in:classes.map(c=>c.id)}},orderBy:{createdAt:'desc'},take:10});
    return [...courses.map(c=>({id:c.id,title:c.title,label:'课程动态',path:'/courses/'+c.id,createdAt:c.createdAt})),...announcements.map(a=>({id:a.id,title:a.title,label:'班级公告 · '+classes.find(c=>c.id===a.classId)?.title,path:'/classes/'+a.classId,createdAt:a.createdAt}))].sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime()).slice(0,10);
  }
  @Post("teachers/:id/follow") async follow(
    @Req() r: any,
    @Param("id") id: string,
  ) {
    if (!(await db.user.findFirst({ where: { id, role: "TEACHER" } })))
      throw new NotFoundException();
    return db.follow.upsert({
      where: { userId_teacherId: { userId: r.user.id, teacherId: id } },
      update: {},
      create: { userId: r.user.id, teacherId: id },
    });
  }
  @Get("classes") async classes(@Req() r: any) {
    const memberships = await db.member.findMany({
      where: { userId: r.user.id },
    });
    return db.schoolClass.findMany({
      where:
        r.user.role === "ADMIN"
          ? {}
          : r.user.role === "TEACHER"
            ? { teacherId: r.user.id }
            : { id: { in: memberships.map((m) => m.classId) } },
    });
  }
  @Post("classes") createClass(@Req() r: any, @Body() b: any) {
    role(r.user, "TEACHER");
    return db.schoolClass.create({
      data: {
        ...parse(z.object({ title: text.max(150), description: text }), b),
        teacherId: r.user.id,
        code: randomUUID().slice(0, 8).toUpperCase(),
      },
    });
  }
  @Post("classes/join") async join(@Req() r: any, @Body() b: any) {
    role(r.user, "STUDENT");
    const { code } = parse(z.object({ code: text }), b);
    const c = await db.schoolClass.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!c) throw new BadRequestException("邀请码无效");
    return db.member.upsert({
      where: { userId_classId: { userId: r.user.id, classId: c.id } },
      update: {},
      create: { userId: r.user.id, classId: c.id },
    });
  }
  @Get("classes/:id") async classDetail(
    @Req() r: any,
    @Param("id") id: string,
  ) {
    const c = await classAccess(id, r.user);
    const activities = await db.activity.findMany({
      where: { classId: id },
      orderBy: { createdAt: "desc" },
    });
    const manage = r.user.role !== "STUDENT";
    const submissions = await db.submission.findMany({
      where: {
        activityId: { in: activities.map((a) => a.id) },
        ...(manage ? {} : { userId: r.user.id }),
      },
    });
    const members = await db.member.findMany({ where: { classId: id } });
    return {
      ...c,
      activities: activities.map((a) => {
        const { answer, ...rest } = a;
        return manage ? a : rest;
      }),
      submissions,
      files: await db.storedFile.findMany({ where: { classId: id } }),
      members: manage
        ? await db.user.findMany({
            where: { id: { in: members.map((m) => m.userId) } },
            select: { id: true, name: true },
          })
        : [],
      memberCount: members.length,
    };
  }
  @Post("classes/:id/activities") async activity(
    @Req() r: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    await teacherClass(id, r.user);
    const data = parse(
      z.object({
        kind: z.enum(["NOTICE", "LESSON", "QUIZ", "ASSIGNMENT"]),
        title: text.max(150),
        content: text,
        options: z.array(text).max(8).default([]),
        answer: z.string().max(1000).default(""),
      }),
      b,
    );
    if (
      data.kind === "QUIZ" &&
      (!data.answer ||
        data.options.length < 2 ||
        !data.options.includes(data.answer))
    )
      throw new BadRequestException("选择题至少两个选项，答案必须在选项中");
    return db.activity.create({ data: { ...data, classId: id } });
  }
  @Post("activities/:id/submit") async submit(
    @Req() r: any,
    @Param("id") id: string,
    @Body() b: any,
  ) {
    role(r.user, "STUDENT");
    const a = await db.activity.findUnique({ where: { id } });
    if (!a) throw new NotFoundException();
    await classAccess(a.classId, r.user);
    if (!["QUIZ", "ASSIGNMENT"].includes(a.kind))
      throw new BadRequestException();
    const data = parse(
      z.object({ content: text, fileId: z.string().optional() }),
      b,
    );
    if (
      data.fileId &&
      !(await db.storedFile.findFirst({
        where: {
          id: data.fileId,
          ownerId: r.user.id,
          courseId: null,
          classId: null,
        },
      }))
    )
      throw new ForbiddenException();
    const value = {
      ...data,
      correct: a.kind === "QUIZ" ? data.content === a.answer : null,
    };
    return db.submission.upsert({
      where: { activityId_userId: { activityId: id, userId: r.user.id } },
      update: value,
      create: { ...value, activityId: id, userId: r.user.id },
    });
  }
  @Post("files")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  async upload(
    @Req() r: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() b: any,
  ) {
    if (!file) throw new BadRequestException("请选择文件");
    if (b.classId) await teacherClass(b.classId, r.user);
    if (b.courseId) {
      role(r.user, "TEACHER");
      const c = await db.course.findUnique({ where: { id: b.courseId } });
      if (c?.teacherId !== r.user.id) throw new ForbiddenException();
    }
    const key = randomUUID();
    await minio.putObject(bucket, key, file.buffer, file.size, {
      "Content-Type": "application/octet-stream",
    });
    return db.storedFile.create({
      data: {
        ownerId: r.user.id,
        name: Buffer.from(file.originalname, "latin1").toString("utf8"),
        objectKey: key,
        mime: file.mimetype,
        size: file.size,
        classId: b.classId || null,
        courseId: b.courseId || null,
      },
    });
  }
  @Get("files/:id") async download(
    @Req() r: any,
    @Param("id") id: string,
    @Res() res: any,
  ) {
    const f = await db.storedFile.findUnique({ where: { id } });
    if (!f) throw new NotFoundException();
    if (f.ownerId !== r.user.id && r.user.role !== "ADMIN") {
      if (f.classId) await classAccess(f.classId, r.user);
      else if (f.courseId) {
        const c = await db.course.findUnique({ where: { id: f.courseId } });
        if (
          c?.teacherId !== r.user.id &&
          !(await db.enrollment.findUnique({
            where: {
              userId_courseId: { userId: r.user.id, courseId: f.courseId },
            },
          }))
        )
          throw new ForbiddenException();
      } else {
        const submissions = await db.submission.findMany({
          where: { fileId: id },
        });
        role(r.user,'TEACHER');
        const ownedClasses=await db.schoolClass.findMany({where:{teacherId:r.user.id},select:{id:true}});
        const authorized=await db.activity.findFirst({where:{id:{in:submissions.map(s=>s.activityId)},classId:{in:ownedClasses.map(c=>c.id)}}});
        if (!authorized) throw new ForbiddenException();
      }
    }
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`,
    );
    (await minio.getObject(bucket, f.objectKey)).pipe(res);
  }
  @Get("admin") async admin(@Req() r: any) {
    role(r.user, "ADMIN");
    return {
      users: await db.user.count(),
      courses: await db.course.count(),
      classes: await db.schoolClass.count(),
      orders: await db.transaction.count({ where: { kind: "PURCHASE" } }),
    };
  }
}
