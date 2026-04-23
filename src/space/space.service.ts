import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Space } from './entities/space.entity';

@Injectable()
export class SpaceService {
  constructor(
    @InjectRepository(Space)
    private readonly spaceRepository: Repository<Space>,
  ) {}

  create(createSpaceDto: CreateSpaceDto) {
    const newSpace = this.spaceRepository.create(createSpaceDto);
    return this.spaceRepository.save(newSpace);
  }

  findAll() {
    return this.spaceRepository.find({
      relations: ['space_type', 'zone'],
    });
  }

  async findOne(space_id: number) {
    const space = await this.spaceRepository.findOne({
      where: { space_id },
      relations: ['space_type', 'zone'],
    });

    if (!space) {
      throw new NotFoundException();
    }

    return space;
  }

  async update(id: number, updateSpaceDto: UpdateSpaceDto) {
    const existingSpace = await this.findOne(id);

    this.spaceRepository.merge(existingSpace, updateSpaceDto);

    return this.spaceRepository.save(existingSpace);
  }

  async remove(id: number) {
    const existingSpace = await this.findOne(id);
    await this.spaceRepository.softRemove(existingSpace);

    return existingSpace;
  }
}
