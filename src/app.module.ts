import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validate } from './env.validation';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { AuthModule } from './auth/auth.module';
import { ReservationModule } from './reservation/reservation.module';
import { SpaceTypeModule } from './space_type/space_type.module';
import { SpaceModule } from './space/space.module';
import { BlockModule } from './block/block.module';
import { ZoneModule } from './zone/zone.module';
import { FloorModule } from './floor/floor.module';
import { BuildingModule } from './building/building.module';
import { SiteModule } from './site/site.module';
import { SpaceUserUsageModule } from './space_user_usage/space_user_usage.module';
import { ReleaseModule } from './release/release.module';
import { CheckEventModule } from './check_event/check_event.module';
import { PriorityLevelModule } from './priority_level/priority_level.module';
import { VisitModule } from './visit/visit.module';
import { UserNeedModule } from './user_need/user_need.module';
import { EventModule } from './event/event.module';
import { PointsLedgerModule } from './points_ledger/points_ledger.module';
import { BadgeModule } from './badge/badge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        ssl:
          process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }),
    }),
    UserModule,
    RoleModule,
    AuthModule,
    ReservationModule,
    SpaceTypeModule,
    SpaceModule,
    BlockModule,
    ZoneModule,
    FloorModule,
    BuildingModule,
    SiteModule,
    SpaceUserUsageModule,
    ReleaseModule,
    CheckEventModule,
    PriorityLevelModule,
    VisitModule,
    UserNeedModule,
    EventModule,
    PointsLedgerModule,
    BadgeModule,

    // App Module imports other modules here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
