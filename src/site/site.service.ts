import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Site } from './entities/site.entity';

@Injectable()
export class SiteService {
  constructor(
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
  ) {}

  create(createSiteDto: CreateSiteDto) {
    const newSite = this.siteRepository.create(createSiteDto);
    return this.siteRepository.save(newSite);
  }

  findAll() {
    return this.siteRepository.find({
      relations: ['buildings'],
    });
  }

  async findOne(site_id: number) {
    const site = await this.siteRepository.findOne({
      where: { site_id },
      relations: ['buildings'],
    });

    if (!site) {
      throw new NotFoundException();
    }

    return site;
  }

  async update(id: number, updateSiteDto: UpdateSiteDto) {
    const existingSite = await this.findOne(id);

    this.siteRepository.merge(existingSite, updateSiteDto);

    return this.siteRepository.save(existingSite);
  }

  async remove(id: number) {
    const existingSite = await this.findOne(id);
    await this.siteRepository.softRemove(existingSite);

    return existingSite;
  }
}
