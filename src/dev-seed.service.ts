import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { UserService } from './user/user.service';
import { UserStatus, UserType } from './user/dto/create-user.dto';
import { DataSource } from 'typeorm';
import { RoleService } from './role/role.service';
import { GamificationReward } from './gamification/entities/gamification-reward.entity';

// Constantes para el Admin
const DEMO_USER_EMAIL = 'demo@workhub.local';
const DEMO_USER_PASSWORD = 'WorkHub123!';
const ADMIN_ROLE_NAME = 'admin';

// --- NUEVAS CONSTANTES PARA EL USUARIO REGULAR ---
const REGULAR_USER_EMAIL = 'gusgus@workhub';
const REGULAR_USER_PASSWORD = 'UserHub123!';
const REGULAR_ROLE_NAME = 'user'; // O 'employee', según manejes tus roles
// -------------------------------------------------

@Injectable()
export class DevSeedService implements OnApplicationBootstrap {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly dataSource: DataSource,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const roles = await this.roleService.findAll();
    
    // 1. Manejo del Rol Admin
    let adminRole = roles.find((role) => role.name.toLowerCase() === ADMIN_ROLE_NAME);
    if (!adminRole) {
      adminRole = await this.roleService.create({ name: ADMIN_ROLE_NAME });
    }

    // 2. Manejo del Rol Regular (NUEVO)
    let regularRole = roles.find((role) => role.name.toLowerCase() === REGULAR_ROLE_NAME);
    if (!regularRole) {
      regularRole = await this.roleService.create({ name: REGULAR_ROLE_NAME });
    }

    const rewardRepository = this.dataSource.getRepository(GamificationReward);
    
    // Buscar ambos usuarios existentes
    let demoUser = await this.userService.findByEmail(DEMO_USER_EMAIL);
    let regularUser = await this.userService.findByEmail(REGULAR_USER_EMAIL); // (NUEVO)

    // Reiniciar secuencias de Postgres
    await this.dataSource.query(`
      SELECT setval(
        pg_get_serial_sequence('"user"', 'user_id'),
        COALESCE((SELECT MAX(user_id) FROM "user"), 0)
      )
    `);

    // 3. Creación/Actualización del Admin
    if (!demoUser) {
      demoUser = await this.userService.create({
        email: DEMO_USER_EMAIL,
        password: DEMO_USER_PASSWORD,
        full_name: 'Demo Admin',
        user_type: UserType.INTERNAL,
        status: UserStatus.ACTIVE,
        role_id: adminRole.role_id,
      });
    } else if (demoUser.role?.name?.toLowerCase() !== ADMIN_ROLE_NAME) {
      demoUser = await this.userService.update(demoUser.user_id, {
        role_id: adminRole.role_id,
      });
    } 

    // 4. Creación/Actualización del Usuario Regular (NUEVO)
    if (!regularUser) {
      regularUser = await this.userService.create({
        email: REGULAR_USER_EMAIL,
        password: REGULAR_USER_PASSWORD,
        full_name: 'Regular User',
        user_type: UserType.INTERNAL,
        status: UserStatus.ACTIVE,
        role_id: regularRole.role_id, // Se le asigna el rol 'user'
      });
    } else if (regularUser.role?.name?.toLowerCase() !== REGULAR_ROLE_NAME) {
      regularUser = await this.userService.update(regularUser.user_id, {
        role_id: regularRole.role_id,
      });
    }

    // 5. Premios de gamificación (Se mantiene igual)
    const existingRewards = await rewardRepository.count();
    if (existingRewards === 0 && demoUser) {
      await rewardRepository.save(
        rewardRepository.create({
          title: 'Premio quincenal demo',
          description: 'Reconocimiento inicial para probar la sección de premios.',
          points: 50,
          period_start: new Date(),
          period_end: new Date(),
        }),
      );
    }
  }
}
