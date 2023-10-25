import { NestRequest } from '@interfaces/request.interface'
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const dbMember = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const req: NestRequest = context.switchToHttp().getRequest()
  return req.member
})

export const dbUser = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const req: NestRequest = context.switchToHttp().getRequest()
  return req.user
})

export const discordUser = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const req: NestRequest = context.switchToHttp().getRequest()
  return req.discordUser
})
