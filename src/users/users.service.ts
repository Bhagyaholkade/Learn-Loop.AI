
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { SignupDto } from '../auth/dto/signup.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async signup(signupDto: SignupDto) {
    const { name, email, password } = signupDto;

    // 1. Check whether the email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    // 2. Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create the new user
    const user = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    // 4. Save the user in MySQL
    const savedUser = await this.userRepository.save(user);

    // 5. Never return the password in the API response
    return {
      message: 'User registered successfully',
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        createdAt: savedUser.createdAt,
      },
    };
  }
  
async findByEmailWithPassword(email: string): Promise<User | null> {
  return this.userRepository
    .createQueryBuilder('user')
    .addSelect('user.password')
    .where('user.email = :email', { email })
    .getOne();
}


}