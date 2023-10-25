import { ConfigModule } from '@nestjs/config'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose/dist'
import { WinstonModule } from 'nest-winston'
import { format, transports } from 'winston'
import * as colors from 'colors/safe'
import 'winston-daily-rotate-file'

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    WinstonModule.forRootAsync({
      useFactory: () => ({
        transports: [
          // file on daily rotation (error only)
          new transports.DailyRotateFile({
            // %DATE will be replaced by the current date
            filename: `logs/%DATE%-error.log`,
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            json: false,
            zippedArchive: false, // don't want to zip our logs
            maxFiles: '30d', // will keep log until they are older than 30 days
            format: format.combine(
              format.timestamp({ format: 'HH:mm:ss A' }),
              format((info) => {
                info.level = info.level.toUpperCase()
                info.service = info.context ? `[${info.context}]` : ''
                return info
              })(),
              format.errors({ stack: true }),
              format.prettyPrint({ depth: 3, colorize: true }),
              format.splat(),
              format.printf(
                ({ timestamp, level, message, service }) => `[${timestamp}] [${level}] ${service} ${message}`,
              ),
            ),
          }),
          // same for all levels
          new transports.DailyRotateFile({
            level: process.env.LOG_LEVEL || 'info',
            filename: `logs/%DATE%-combined.log`,
            datePattern: 'YYYY-MM-DD',
            json: false,
            zippedArchive: false,
            maxFiles: '30d',
            format: format.combine(
              format.timestamp({ format: 'HH:mm:ss A' }),
              format((info) => {
                info.level = info.level.toUpperCase()
                info.service = info.context ? `[${info.context}]` : ''
                return info
              })(),
              format.errors({ stack: true }),
              format.prettyPrint({ depth: 3, colorize: true }),
              format.splat(),
              format.printf(
                ({ timestamp, level, message, service }) => `[${timestamp}] [${level}] ${service} ${message}`,
              ),
            ),
          }),
          new transports.Console({
            level: process.env.CONSOLE_LOG_LEVEL || 'info',
            format: format.combine(
              format.timestamp({ format: 'HH:mm:ss' }),
              format((info) => {
                info.level = `[${info.level.toUpperCase()}]`
                info.timestamp = colors.grey(`[${info.timestamp}]`)
                info.service = info.context ? colors.magenta(`[${info.context}]`) : ''
                return info
              })(),
              format.errors({ stack: true }),
              format.prettyPrint({ depth: 3, colorize: true }),
              format.splat(),
              format.colorize({ level: true }),
              format.printf(({ timestamp, level, message, service }) => `${timestamp} ${level} ${service} ${message}`),
            ),
          }),
        ],
      }),
      inject: [],
    }),
  ],
})
export class BootstrapModule {}
