import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleService } from '../role/role.service';
import bcrypt from 'bcrypt';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly roleService: RoleService,
  ) {}

  private hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  }

  comparePassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }

  async create(createUserDto: CreateUserDto) {
    const { role_id, password, ...rest } = createUserDto;

    if (password === undefined) {
      throw new BadRequestException('Password is required');
    }

    const newUser = this.userRepository.create({
      ...rest,
      password: await this.hashPassword(password),
    });

    if (role_id) {
      const existingRole = await this.roleService.findOne(role_id);
      newUser.role = existingRole;
    }
    return this.userRepository.save(newUser);
  }

  findAll() {
    return this.userRepository.find({
      relations: ['role'],
    });
  }

  async findOne(user_id: number) {
    const user = await this.userRepository.findOne({
      where: { user_id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    return user;
  }

  async findByRole(role_id: number) {
    const users = await this.userRepository.find({
      where: { role: { role_id } },
      relations: ['role'],
    });
    return users;
  }

  findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const existingUser = await this.findOne(id);
    const { role_id, password, ...rest } = updateUserDto;

    if (role_id) {
      const existingRole = await this.roleService.findOne(role_id);
      existingUser.role = existingRole;
    }

    const updateUser = {
      ...rest,
      role: existingUser.role,
    } as Partial<User>;

    if (password !== undefined) {
      updateUser.password = await this.hashPassword(password);
    }

    this.userRepository.merge(existingUser, updateUser);

    return this.userRepository.save(existingUser);
  }

  async remove(id: number) {
    const existingUser = await this.findOne(id);
    await this.userRepository.softRemove(existingUser);

    return existingUser;
  }
}
