import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './entities/block.entity';

@Injectable()
export class BlockService {
  constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
  ) {}

  create(createBlockDto: CreateBlockDto) {
    const newBlock = this.blockRepository.create(createBlockDto);
    return this.blockRepository.save(newBlock);
  }

  findAll() {
    return this.blockRepository.find({
      relations: ['space'],
    });
  }

  async findOne(block_id: number) {
    const block = await this.blockRepository.findOne({
      where: { block_id },
      relations: ['space'],
    });

    if (!block) {
      throw new NotFoundException();
    }

    return block;
  }

  async update(id: number, updateBlockDto: UpdateBlockDto) {
    const existingBlock = await this.findOne(id);

    this.blockRepository.merge(existingBlock, updateBlockDto);

    return this.blockRepository.save(existingBlock);
  }

  async remove(id: number) {
    const existingBlock = await this.findOne(id);
    await this.blockRepository.softRemove(existingBlock);

    return existingBlock;
  }
}
