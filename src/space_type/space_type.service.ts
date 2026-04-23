import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSpaceTypeDto } from './dto/create-space_type.dto';
import { UpdateSpaceTypeDto } from './dto/update-space_type.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpaceType } from './entities/space_type.entity';

@Injectable()
export class SpaceTypeService {
  constructor(
    @InjectRepository(SpaceType)
    private readonly spaceTypeRepository: Repository<SpaceType>,
  ) {}

  create(createSpaceTypeDto: CreateSpaceTypeDto) {
    const newSpaceType = this.spaceTypeRepository.create(createSpaceTypeDto);
    return this.spaceTypeRepository.save(newSpaceType);
  }

  findAll() {
    return this.spaceTypeRepository.find();
  }

  async findOne(space_type_id: number) {
    const spaceType = await this.spaceTypeRepository.findOne({
      where: { space_type_id },
    });

    if (!spaceType) {
      throw new NotFoundException();
    }

    return spaceType;
  }

  async update(id: number, updateSpaceTypeDto: UpdateSpaceTypeDto) {
    const existingSpaceType = await this.findOne(id);

    this.spaceTypeRepository.merge(existingSpaceType, updateSpaceTypeDto);

    return this.spaceTypeRepository.save(existingSpaceType);
  }

  async remove(id: number) {
    const existingSpaceType = await this.findOne(id);
    await this.spaceTypeRepository.softRemove(existingSpaceType);

    return existingSpaceType;
  }
}
