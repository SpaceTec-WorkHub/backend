import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateReleaseDto } from './dto/create-release.dto';
import { UpdateReleaseDto } from './dto/update-release.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Release } from './entities/release.entity';

@Injectable()
export class ReleaseService {
  constructor(
    @InjectRepository(Release)
    private readonly releaseRepository: Repository<Release>,
  ) {}

  create(createReleaseDto: CreateReleaseDto) {
    const newRelease = this.releaseRepository.create(createReleaseDto);
    return this.releaseRepository.save(newRelease);
  }

  findAll() {
    return this.releaseRepository.find({
      relations: ['reservation'],
    });
  }

  async findOne(release_id: number) {
    const release = await this.releaseRepository.findOne({
      where: { release_id },
      relations: ['reservation'],
    });

    if (!release) {
      throw new NotFoundException();
    }

    return release;
  }

  async update(id: number, updateReleaseDto: UpdateReleaseDto) {
    const existingRelease = await this.findOne(id);

    this.releaseRepository.merge(existingRelease, updateReleaseDto);

    return this.releaseRepository.save(existingRelease);
  }

  async remove(id: number) {
    const existingRelease = await this.findOne(id);
    await this.releaseRepository.softRemove(existingRelease);

    return existingRelease;
  }
}
