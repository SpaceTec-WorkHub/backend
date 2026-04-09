import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleService } from '../role/role.service';
//import { Role } from '../role/entities/role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly roleService: RoleService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { role_id, ...rest } = createUserDto;

    const newUser = this.userRepository.create(rest);

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

  async update(id: number, updateUserDto: UpdateUserDto) {
    const existingUser = await this.findOne(id);

    if (updateUserDto.role_id) {
      const existingRole = await this.roleService.findOne(
        updateUserDto.role_id,
      );
      existingUser.role = existingRole;
    }

    this.userRepository.merge(existingUser, {
      ...updateUserDto,
      role: existingUser.role,
    });

    return this.userRepository.save(existingUser);
  }

  async remove(id: number) {
    const existingUser = await this.findOne(id);
    await this.userRepository.softRemove(existingUser);

    return existingUser;
  }
}
