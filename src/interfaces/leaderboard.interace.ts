export interface Leaderboard {
  member: LeaderboardMember
  topMembers: LeaderboardMember[]
  adjacentMembers: LeaderboardMember[]
  pageInfo: PageInfo
}

export interface LeaderboardMember {
  guid: string
  uid: string
  exp: number
  rank: number
  level: number
  username: string
  discriminator: string
  avatar: string
}

export interface PageInfo {
  totalItems: number
  currentPage: number
  pageSize: number
  totalPages: number
}
