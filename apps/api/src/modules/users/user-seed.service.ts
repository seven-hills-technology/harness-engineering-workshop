import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';

const BCRYPT_COST = 10;
const SEED_PASSWORD = 'password';

type SeedUserSpec = {
  email: string;
  isAdmin: boolean;
};

const SEED_USERS: SeedUserSpec[] = [
  { email: 'admin@test.com', isAdmin: true },
  { email: 'user@test.com', isAdmin: false },
];

@Injectable()
export class UserSeedService implements OnModuleInit {
  private readonly logger = new Logger(UserSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const count = await this.userRepo.count();
      if (count > 0) {
        this.logger.log(`Users table already seeded (${count} users)`);
        return;
      }

      const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_COST);

      const users = SEED_USERS.map((spec) => {
        const user = new User();
        user.email = spec.email;
        user.isAdmin = spec.isAdmin;
        user.passwordHash = passwordHash;
        return user;
      });

      await this.userRepo.save(users);
      this.logger.log(`Seeded ${users.length} users`);
    } catch (error) {
      this.logger.warn(
        `Failed to seed users: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
