import { DatabaseSeedService } from './seed.service'
import { Command, CommandRunner } from 'nest-commander'

@Command({ name: 'seed' })
export class DatabaseSeedCommand extends CommandRunner {
  constructor(private readonly seedService: DatabaseSeedService) {
    super()
  }

  async run(passedParams: string[], options?: Record<string, any>) {
    if (passedParams.length === 0) {
      console.log('🌱 Start seeding')
      await this.seedService.addUsers()
      console.log('🌱 Users added')
      console.log('🌱 Seeding done 🏁')
    } else if (passedParams[0] === 'reset') {
      console.log('🌱 Start deleting')
      await this.seedService.wipeDatabase()
      console.log('🌱 Deleting done 🏁')
    }
  }
}
