import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Building } from './entities/building.entity';

@Injectable()
export class BuildingService {
  constructor(
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
  ) {}

  create(createBuildingDto: CreateBuildingDto) {
    const newBuilding = this.buildingRepository.create(createBuildingDto);
    return this.buildingRepository.save(newBuilding);
  }

  findAll() {
    return this.buildingRepository.find({
      relations: ['site', 'floors'],
    });
  }

  async findOne(building_id: number) {
    const building = await this.buildingRepository.findOne({
      where: { building_id },
      relations: ['site', 'floors'],
    });

    if (!building) {
      throw new NotFoundException();
    }

    return building;
  }

  async update(id: number, updateBuildingDto: UpdateBuildingDto) {
    const existingBuilding = await this.findOne(id);

    this.buildingRepository.merge(existingBuilding, updateBuildingDto);

    return this.buildingRepository.save(existingBuilding);
  }

  async remove(id: number) {
    const existingBuilding = await this.findOne(id);
    await this.buildingRepository.softRemove(existingBuilding);

    return existingBuilding;
  }
}
