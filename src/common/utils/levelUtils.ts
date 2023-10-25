import { LevelRole } from 'src/resources/unity/guild/entities/settings/levelSettings.entity'
import { templateSettings, template } from 'lodash'

export const createMessage = (message: string, data: object) => {
  templateSettings.interpolate = /{{([\s\S]+?)}}/g
  const compiled = template(message)
  return compiled(data)
}

export const getRoleByLevel = (roles: LevelRole[], level: number) => {
  if (roles.length === 0) return undefined
  for (let i = roles.length - 1; i >= 0; i--) {
    if (roles[i].level <= level) {
      return roles[i]
    }
  }
  return undefined
}

export const getLevelByExp = (exp: number, constant: number) => {
  return Math.floor(constant * Math.sqrt(exp))
}

export const getExpByLevel = (level: number, constant: number) => {
  return Math.floor((level / constant) ** 2)
}
