import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  Module,
  Controller,
  Post,
  Get,
  Body,
  UnauthorizedException,
} from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "./db";
import { secret, safeUser } from "./auth";
import { SchoolController, parse, redis, minio, bucket } from "./school";
import { seed } from "./seed";
@Controller()
class PublicController {
  @Get("health") async health() {
    await db.$queryRaw`SELECT 1`;
    await redis.ping();
    await minio.bucketExists(bucket);
    return { status: "ok" };
  }
  @Post("auth/login") async login(@Body() body: any) {
    const b = parse(
      z.object({
        username: z.string().max(100),
        password: z.string().max(100),
      }),
      body,
    );
    const user = await db.user.findUnique({ where: { username: b.username } });
    if (!user || !(await compare(b.password, user.password)))
      throw new UnauthorizedException("账号或密码不正确");
    return {
      token: jwt.sign({ sub: user.id }, secret, { expiresIn: "8h" }),
      user: safeUser(user),
    };
  }
}
@Module({ controllers: [PublicController, SchoolController] })
class AppModule {}
async function main() {
  await db.$connect();
  await redis.connect();
  if (!(await minio.bucketExists(bucket))) await minio.makeBucket(bucket);
  await seed();
  const guide = Buffer.from('OnlyStudent 学习资料\n\n函数 f(x)=2x+1。\n当 x=3 时，f(3)=7。\n请在班级练习中完成热身题，再举一个生活中的函数例子。\n');
  if (!await db.storedFile.findUnique({where:{id:'demo-guide'}})) {
    await minio.putObject(bucket,'demo-guide',guide,guide.length);
    await db.storedFile.create({data:{id:'demo-guide',ownerId:'teacher',classId:'demo-class',name:'函数入门学习指南.txt',objectKey:'demo-guide',mime:'text/plain',size:guide.length}});
  }
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({ origin: process.env.WEB_ORIGIN || "http://localhost:5173" });
  SwaggerModule.setup(
    "api/docs",
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle("OnlyStudent API").addBearerAuth().build(),
    ),
  );
  await app.listen(3000, "0.0.0.0");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
