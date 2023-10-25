import { ImagePayload } from '@interfaces/payloads.interface'
import { createCanvas, loadImage, registerFont } from 'canvas'
import path from 'path'
import fs from 'fs'

export function constructCanvas() {
  const canvas = createCanvas(800, 800)
  const ctx = canvas.getContext('2d')
  // register custom font
  registerFont('src/assets/canvas/RockoFont.ttf', { family: 'Rocko' }) // TODO: Fix this path, not loading font
  // set background color
  ctx.fillStyle = '#36393f'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return canvas
}

export function drawProgressArc(canvas, x, y, size, progress, startExp, endExp, currentRoleColor, nextRoleColor) {
  const ctx = canvas.getContext('2d') // NodeCanvasRenderingContext2D
  const circleX = x // center x coordinate
  const circleY = y // center y coordinate
  const radius = size // ring radius
  const percent = progress // final percentage
  const lineWidth = radius / 25 // the width of the circular line

  // create color gradient
  const linGrad = ctx.createLinearGradient(circleX - radius - lineWidth, circleY, circleX + radius + lineWidth, circleY)
  linGrad.addColorStop(0.0, currentRoleColor)
  linGrad.addColorStop(1.0, nextRoleColor)

  // draw base arc
  ctx.beginPath()
  ctx.lineCap = 'round'
  ctx.lineWidth = radius / 3.25
  ctx.arc(circleX, circleY, radius, 1 * Math.PI, 0)
  ctx.stroke()

  // draw progress arc
  ctx.beginPath()
  ctx.strokeStyle = linGrad
  ctx.arc(circleX, circleY, radius, 1 * Math.PI, (percent / 100 + 1) * Math.PI) // (percent / 100 + 1) * Math.PI = angle for arc based on percent
  ctx.stroke()
  ctx.closePath()

  // set font
  ctx.font = '33px "Rocko"'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // draw percent text
  ctx.fillText(`${percent}%`, circleX + 5, 245)

  // draw start exp
  ctx.font = '31px "Rocko"'
  ctx.fillStyle = currentRoleColor
  ctx.fillText(startExp, 112, 600)

  // draw end exp
  ctx.fillStyle = nextRoleColor

  ctx.fillText(endExp, 695, 600)
}

export async function drawUser(canvas, username, discriminator, avatar) {
  const ctx = canvas.getContext('2d')

  // load user avatar
  /* const file = path.join(__dirname, '/img/images/83ae65bc2da1f4962bcb3a28f7a801f8.png'); */
  const image = await loadImage(avatar)

  // calculate position
  const aW = 290, // width of scaled up avatar
    aH = 290, // height of scaled up avatar
    aX = canvas.width / 2 - aW / 2, // x of scaled up avatar
    aY = 476 - aH / 2, // y of scaled up avatar
    cX = canvas.width / 2 // Center x of canvas

  // draw and crop avatar
  ctx.save()
  ctx.beginPath()
  ctx.arc(cX, 476, aW / 2, 0, 6.28, false) // draw the circle
  ctx.lineWidth = 1
  ctx.clip() // call the clip method so the next render is clipped in last path
  ctx.drawImage(image, aX, aY, aW, aH)
  /* ctx.stroke() */
  ctx.closePath()
  ctx.restore()

  // draw username
  const name = username
  ctx.fillStyle = 'white'
  ctx.font = `55px "Rocko"`
  // prevents name from going out of boundaries
  // adjusts size accordingly
  for (let px = 74, w = ctx.measureText(name).width; w > canvas.width - 125; px--) {
    ctx.font = `${px}px "Rocko"`
    w = ctx.measureText(name).width
  }
  ctx.fillText(name, cX, 660)

  // draw discriminator
  ctx.font = '21px "Rocko"'
  ctx.fillStyle = '#afafaf'
  ctx.fillText(discriminator, cX, 710)
}

export async function drawLevel(canvas, level, rank) {
  const ctx = canvas.getContext('2d')
  const cX = canvas.width / 2

  // draw level
  ctx.font = '72px "Rocko"'
  ctx.fillStyle = 'white'
  ctx.fillText(`Level ${level}`, cX, 90)

  // draw crown image if rank is in top 3
  let imgPath = ''
  switch (rank) {
    case 3:
      ctx.fillStyle = '#a66e51'
      imgPath = 'brown_crown.png'
      break
    case 2:
      ctx.fillStyle = '#c1bdbd'
      imgPath = 'silver_crown.png'
      break
    case 1:
      ctx.fillStyle = '#eac643'
      imgPath = 'gold_crown.png'
      break
    default:
      ctx.fillStyle = '#afafaf'
      break
  }

  if (ctx.fillStyle !== '#afafaf') {
    // const file = path.join(__dirname, imgPath)
    const image = await loadImage('src/assets/canvas/' + imgPath)
    // calculate position
    const iW = 49,
      iH = 33,
      iX = 327 - iW / 2,
      iY = 152 - iH / 2
    ctx.drawImage(image, iX, iY, iW, iH)
  }

  // draw rank
  ctx.font = '33px "Rocko"'

  ctx.fillText(`Rank ${rank}`, cX, 150)
}

// export function writeCanvas(canvas) {
//   const out = fs.createWriteStream(path.join(__dirname, '/profile.png'))
//   const stream = canvas.createPNGStream()
//   stream.pipe(out)
//   out.on('finish', () => console.log('The PNG file was created.'))
// }

export default async function drawProfile(profileData: ImagePayload) {
  const {
    username,
    discriminator,
    avatar,
    percentage,
    startExp,
    endExp,
    level,
    rank,
    currentRoleColor,
    nextRoleColor,
  } = profileData
  const canvas = constructCanvas()
  drawProgressArc(canvas, canvas.width / 2, 530, 290, percentage, startExp, endExp, currentRoleColor, nextRoleColor) // 325
  await drawUser(canvas, username, discriminator, avatar)
  await drawLevel(canvas, level, rank)
  // writeCanvas(canvas);
  console.log(canvas)

  return canvas.createPNGStream()
}
