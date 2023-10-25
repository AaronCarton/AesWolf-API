import { NestRequest } from '@interfaces/request.interface'
import { CanActivate, ExecutionContext, Injectable, mixin } from '@nestjs/common'
import { UserRole } from 'src/resources/unity/user/entities/user.entity'
import { UserService } from 'src/resources/unity/user/user.service'

export const RolesGuard = (requiredRole: UserRole) => {
  @Injectable()
  class RolesGuardMixin implements CanActivate {
    constructor(readonly userService: UserService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req: NestRequest = context.switchToHttp().getRequest()
      const user = req.user
      const { role } = await this.userService.findUserByUid(user.uid)

      return requiredRole <= role
    }
  }

  const guard = mixin(RolesGuardMixin)
  return guard
}
