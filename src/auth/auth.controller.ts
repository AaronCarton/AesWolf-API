import { Controller, Get, Query, Redirect, Res } from '@nestjs/common'
import { Response } from 'express'
import axios from 'axios'

@Controller('auth')
export class AuthController {
  @Get('login')
  @Redirect()
  login() {
    // Redirect to Discord OAuth2 login
    const url = `https://discord.com/api/oauth2/authorize?client_id=941518002933866536&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&response_type=code&scope=guilds.members.read%20guilds%20identify`
    return { url }
  }

  @Get('callback')
  async callback(@Res() res: Response, @Query('code') code: string) {
    // Construct body params
    const params = new URLSearchParams({
      client_id: process.env.CLIENT_ID!,
      client_secret: process.env.CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.REDIRECT_URI!,
    })

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Encoding': 'application/x-www-form-urlencoded',
    }

    // Post request to exchange code for an access token
    const response = await axios.post('https://discord.com/api/oauth2/token', params, {
      headers,
    })

    // set cookie
    res.cookie('token', response.data.access_token, {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      // httpOnly: true,
    })

    res.redirect(process.env.FRONTEND_REDIRECT_URI!)

    // return { token: response.data.access_token }
  }
}
