import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import jwt from "jsonwebtoken";
import { db } from "./db";
export const secret =
  process.env.JWT_SECRET || "onlystudent-local-demo-change-before-production";
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    try {
      const payload = jwt.verify(
        (req.headers.authorization || "").replace(/^Bearer /, ""),
        secret,
      ) as { sub: string };
      req.user = await db.user.findUniqueOrThrow({
        where: { id: payload.sub },
      });
      return true;
    } catch {
      throw new UnauthorizedException("请重新登录");
    }
  }
}
export function role(user: any, ...roles: string[]) {
  if (!roles.includes(user.role))
    throw new ForbiddenException("当前身份无权执行此操作");
}
export function safeUser(user: any) {
  const { password, ...rest } = user;
  return rest;
}
