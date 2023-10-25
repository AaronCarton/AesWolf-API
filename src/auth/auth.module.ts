import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'

@Module({
  imports: [HttpModule],
  providers: [],
  controllers: [AuthController],
})
export class AuthModule {}
