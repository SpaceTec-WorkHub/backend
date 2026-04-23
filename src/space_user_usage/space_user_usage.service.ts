import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSpaceUserUsageDto } from './dto/create-space_user_usage.dto';
import { UpdateSpaceUserUsageDto } from './dto/update-space_user_usage.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpaceUserUsage } from './entities/space_user_usage.entity';

@Injectable()
export class SpaceUserUsageService {
  constructor(
    @InjectRepository(SpaceUserUsage)
    private readonly spaceUserUsageRepository: Repository<SpaceUserUsage>,
  ) {}

  create(createSpaceUserUsageDto: CreateSpaceUserUsageDto) {
    const newSpaceUserUsage = this.spaceUserUsageRepository.create(
      createSpaceUserUsageDto,
    );

    return this.spaceUserUsageRepository.save(newSpaceUserUsage);
  }

  findAll() {
    return this.spaceUserUsageRepository.find({
      relations: ['user', 'space'],
    });
  }

  async findOne(user_id: number, space_id: number) {
    const spaceUserUsage = await this.spaceUserUsageRepository.findOne({
      where: { user_id, space_id },
      relations: ['user', 'space'],
    });

    if (!spaceUserUsage) {
      throw new NotFoundException();
    }

    return spaceUserUsage;
  }

  async update(
    user_id: number,
    space_id: number,
    updateSpaceUserUsageDto: UpdateSpaceUserUsageDto,
  ) {
    const existingSpaceUserUsage = await this.findOne(user_id, space_id);

    this.spaceUserUsageRepository.merge(
      existingSpaceUserUsage,
      updateSpaceUserUsageDto,
    );

    return this.spaceUserUsageRepository.save(existingSpaceUserUsage);
  }

  async remove(user_id: number, space_id: number) {
    const existingSpaceUserUsage = await this.findOne(user_id, space_id);
    await this.spaceUserUsageRepository.softRemove(existingSpaceUserUsage);

    return existingSpaceUserUsage;
  }
}
