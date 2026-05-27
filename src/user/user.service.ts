import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
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

  private async findOneWithPassword(user_id: number) {
    const user = await this.userRepository.findOne({
      where: { user_id },
      relations: ['role', 'vehicles'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    return user;
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
    const user = await this.findOneWithPassword(user_id);
    const { password: _password, ...safeUser } = user;

    return safeUser;
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
    const existingUser = await this.findOneWithPassword(id);
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

  async verifyPassword(userId: number, currentPassword: string) {
    const user = await this.findOneWithPassword(userId);

    if (!user.password) {
      throw new BadRequestException('Password is not configured for this user');
    }

    const passwordMatches = await this.comparePassword(currentPassword, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    return { verified: true };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const { current_password, new_password, confirm_password } = changePasswordDto;

    if (new_password !== confirm_password) {
      throw new BadRequestException('New password confirmation does not match');
    }

    const user = await this.findOneWithPassword(userId);

    if (!user.password) {
      throw new BadRequestException('Password is not configured for this user');
    }

    const passwordMatches = await this.comparePassword(current_password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await this.hashPassword(new_password);

    await this.userRepository.save(user);

    return { message: 'Password updated successfully' };
  }

  async remove(id: number) {
    const existingUser = await this.findOne(id);
    await this.userRepository.softRemove(existingUser);

    return existingUser;
  }
}
