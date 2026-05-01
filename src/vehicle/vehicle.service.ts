import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createVehicleDto: CreateVehicleDto) {
    const owner = await this.userRepository.findOne({
      where: { user_id: createVehicleDto.owner_id },
    });

    if (!owner) {
      throw new NotFoundException('Owner not found');
    }

    const vehicle = this.vehicleRepository.create({
      ...createVehicleDto,
      owner,
    });

    return this.vehicleRepository.save(vehicle);
  }

  async findAll() {
    return this.vehicleRepository.find({
      relations: ['owner', 'trips'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const vehicle = await this.vehicleRepository.findOne({
      where: { vehicle_id: id },
      relations: ['owner', 'trips'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async update(id: number, updateVehicleDto: UpdateVehicleDto) {
    const vehicle = await this.findOne(id);

    if (updateVehicleDto.owner_id) {
      const owner = await this.userRepository.findOne({
        where: { user_id: updateVehicleDto.owner_id },
      });

      if (!owner) {
        throw new NotFoundException('Owner not found');
      }

      vehicle.owner = owner;
      vehicle.owner_id = owner.user_id;
    }

    Object.assign(vehicle, updateVehicleDto);
    return this.vehicleRepository.save(vehicle);
  }

  async remove(id: number) {
    const vehicle = await this.findOne(id);
    return this.vehicleRepository.softRemove(vehicle);
  }
}
