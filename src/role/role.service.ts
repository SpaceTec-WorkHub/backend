import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  create(createRoleDto: CreateRoleDto) {
    const newRole = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(newRole);
  }

  findAll() {
    return this.roleRepository.find({
      relations: ['users'],
    });
  }

  async findOne(role_id: number) {
    const role = await this.roleRepository.findOne({
      where: { role_id },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException();
    }

    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const existingRole = await this.findOne(id);

    this.roleRepository.merge(existingRole, updateRoleDto);

    return this.roleRepository.save(existingRole);
  }

  async remove(id: number) {
    const existingRole = await this.findOne(id);
    await this.roleRepository.softRemove(existingRole);

    return existingRole;
  }
}