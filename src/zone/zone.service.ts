import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from './entities/zone.entity';

@Injectable()
export class ZoneService {
  constructor(
    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,
  ) {}

  create(createZoneDto: CreateZoneDto) {
    const newZone = this.zoneRepository.create(createZoneDto);
    return this.zoneRepository.save(newZone);
  }

  findAll() {
    return this.zoneRepository.find({
      relations: ['floor', 'spaces'],
    });
  }

  async findOne(zone_id: number) {
    const zone = await this.zoneRepository.findOne({
      where: { zone_id },
      relations: ['floor', 'spaces'],
    });

    if (!zone) {
      throw new NotFoundException();
    }

    return zone;
  }

  async update(id: number, updateZoneDto: UpdateZoneDto) {
    const existingZone = await this.findOne(id);

    this.zoneRepository.merge(existingZone, updateZoneDto);

    return this.zoneRepository.save(existingZone);
  }

  async remove(id: number) {
    const existingZone = await this.findOne(id);
    await this.zoneRepository.softRemove(existingZone);

    return existingZone;
  }
}
