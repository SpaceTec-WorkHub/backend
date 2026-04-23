import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Floor } from './entities/floor.entity';

@Injectable()
export class FloorService {
  constructor(
    @InjectRepository(Floor)
    private readonly floorRepository: Repository<Floor>,
  ) {}

  create(createFloorDto: CreateFloorDto) {
    const newFloor = this.floorRepository.create(createFloorDto);
    return this.floorRepository.save(newFloor);
  }

  findAll() {
    return this.floorRepository.find({
      relations: ['building', 'zones'],
    });
  }

  async findOne(floor_id: number) {
    const floor = await this.floorRepository.findOne({
      where: { floor_id },
      relations: ['building', 'zones'],
    });

    if (!floor) {
      throw new NotFoundException();
    }

    return floor;
  }

  async update(id: number, updateFloorDto: UpdateFloorDto) {
    const existingFloor = await this.findOne(id);

    this.floorRepository.merge(existingFloor, updateFloorDto);

    return this.floorRepository.save(existingFloor);
  }

  async remove(id: number) {
    const existingFloor = await this.findOne(id);
    await this.floorRepository.softRemove(existingFloor);

    return existingFloor;
  }
}
