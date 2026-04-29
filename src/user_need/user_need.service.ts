import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserNeed } from './entities/user_need.entity';
import { CreateUserNeedDto } from './dto/create-user_need.dto';
import { UpdateUserNeedDto } from './dto/update-user_need.dto';

@Injectable()
export class UserNeedService {
  constructor(
    @InjectRepository(UserNeed)
    private readonly userNeedRepository: Repository<UserNeed>,
  ) {}

  async create(createUserNeedDto: CreateUserNeedDto) {
    const newUserNeed = this.userNeedRepository.create(createUserNeedDto);
    return this.userNeedRepository.save(newUserNeed);
  }

  async findAll() {
    return this.userNeedRepository.find({
      relations: ['user', 'priorityLevel'],
    });
  }

  async findOne(id: number) {
    const userNeed = await this.userNeedRepository.findOne({
      where: { user_need_id: id },
      relations: ['user', 'priorityLevel'],
    });
    if (!userNeed) {
      throw new NotFoundException('UserNeed not found');
    }
    return userNeed;
  }

  async update(id: number, updateUserNeedDto: UpdateUserNeedDto) {
    const userNeed = await this.findOne(id);
    Object.assign(userNeed, updateUserNeedDto);
    return this.userNeedRepository.save(userNeed);
  }

  async remove(id: number) {
    const userNeed = await this.findOne(id);
    return this.userNeedRepository.softRemove(userNeed);
  }
}
