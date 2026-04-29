import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from './entities/badge.entity';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';

@Injectable()
export class BadgeService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
  ) {}

  async create(createBadgeDto: CreateBadgeDto) {
    const newBadge = this.badgeRepository.create(createBadgeDto);
    return this.badgeRepository.save(newBadge);
  }

  async findAll() {
    return this.badgeRepository.find({
      relations: ['users'],
    });
  }

  async findOne(id: number) {
    const badge = await this.badgeRepository.findOne({
      where: { badge_id: id },
      relations: ['users'],
    });
    if (!badge) {
      throw new NotFoundException('Badge not found');
    }
    return badge;
  }

  async update(id: number, updateBadgeDto: UpdateBadgeDto) {
    const badge = await this.findOne(id);
    Object.assign(badge, updateBadgeDto);
    return this.badgeRepository.save(badge);
  }

  async remove(id: number) {
    const badge = await this.findOne(id);
    return this.badgeRepository.softRemove(badge);
  }
}
