import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  Reservation,
  ReservationStatus,
} from '../reservation/entities/reservation.entity';
import { SpaceUserUsage } from '../space_user_usage/entities/space_user_usage.entity';
import { Release } from '../release/entities/release.entity';
import { User } from '../user/entities/user.entity';
import { GamificationReward } from './entities/gamification-reward.entity';
import { CreateGamificationRewardDto } from './dto/create-gamification-reward.dto';
import { UpdateGamificationRewardDto } from './dto/update-gamification-reward.dto';

type PeriodInfo = {
  start: Date;
  end: Date;
  label: string;
};

type LeaderboardRow = {
  rank: number;
  user_id: number;
  full_name: string | null;
  email: string | null;
  role: string | null;
  points: number;
  reservations: number;
  checkIns: number;
  releases: number;
  rewardPoints: number;
  rewardCount: number;
  plannedReservations: number;
  earlyReservations: number;
};

type RewardEntry = {
  gamification_reward_id: number;
  title: string;
  description: string;
  points: number;
  period_start: Date | null;
  period_end: Date | null;
};

type RewardState = {
  period: PeriodInfo;
  rewards: RewardEntry[];
};

const LEVEL_STEP = 250;

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(SpaceUserUsage)
    private readonly spaceUserUsageRepository: Repository<SpaceUserUsage>,
    @InjectRepository(Release)
    private readonly releaseRepository: Repository<Release>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GamificationReward)
    private readonly gamificationRewardRepository: Repository<GamificationReward>,
  ) {}

  private getCurrentPeriod(referenceDate = new Date()): PeriodInfo {
    const start = new Date(referenceDate);
    start.setHours(0, 0, 0, 0);

    if (start.getDate() <= 15) {
      start.setDate(1);
    } else {
      start.setDate(16);
    }

    const end = new Date(start);
    if (referenceDate.getDate() <= 15) {
      end.setDate(15);
    } else {
      end.setMonth(end.getMonth() + 1, 0);
    }
    end.setHours(23, 59, 59, 999);

    const formatter = new Intl.DateTimeFormat('es-MX', {
      month: 'long',
      year: 'numeric',
    });

    let label = '';

    if (referenceDate.getDate() <= 15) {
      label = `1-15 ${formatter.format(start)}`;
    } else {
      label = `16-fin ${formatter.format(start)}`;
    }

    return { start, end, label };
  }

  private getLevel(points: number) {
    const level = Math.max(1, Math.floor(points / LEVEL_STEP) + 1);
    const levelFloor = (level - 1) * LEVEL_STEP;
    const nextLevelPoints = level * LEVEL_STEP;
    const progress = Math.min(
      100,
      Math.max(0, Math.round(((points - levelFloor) / LEVEL_STEP) * 100)),
    );

    return { level, nextLevelPoints, progress };
  }

  private getReservationPoints(reservation: Reservation) {
    let points = 0;

    if (reservation.status === ReservationStatus.RESERVED) {
      points += 10;
    }

    if (reservation.status === ReservationStatus.CHECKED_OUT) {
      points += 20;
    }

    if (reservation.status === ReservationStatus.CANCELLED) {
      points -= 5;
    }

    const createdAt = new Date(reservation.createdAt);
    const startTime = new Date(reservation.start_time);

    if (startTime.getTime() - createdAt.getTime() >= 24 * 60 * 60 * 1000) {
      points += 15;
    }

    if (startTime.getHours() < 10) {
      points += 5;
    }

    return points;
  }

  private mapRewardEntry(reward: GamificationReward): RewardEntry {
    return {
      gamification_reward_id: reward.gamification_reward_id,
      title: reward.title,
      description: reward.description,
      points: reward.points,
      period_start: reward.period_start ?? null,
      period_end: reward.period_end ?? null,
    };
  }

  private async getRewardState(): Promise<RewardState> {
    const period = this.getCurrentPeriod();

    const rewards = await this.gamificationRewardRepository.find({
      order: { createdAt: 'DESC' },
    });

    return {
      period,
      rewards: rewards.map((reward) => this.mapRewardEntry(reward)),
    };
  }

  private async buildLeaderboard() {
    const period = this.getCurrentPeriod();

    const users = await this.userRepository.find({
      relations: ['role'],
      order: { full_name: 'ASC' },
    });

    const [reservations, spaceUsages, releases] = await Promise.all([
      this.reservationRepository.find({
        where: { createdAt: Between(period.start, period.end) },
        order: { createdAt: 'DESC' },
      }),
      this.spaceUserUsageRepository.find({
        where: { createdAt: Between(period.start, period.end) },
      }),
      this.releaseRepository.find({
        where: { createdAt: Between(period.start, period.end) },
        relations: ['reservation'],
      }),
    ]);

    const leaderboardMap = new Map<number, Omit<LeaderboardRow, 'rank'>>();

    for (const user of users) {
      leaderboardMap.set(user.user_id, {
        user_id: user.user_id,
        full_name: user.full_name ?? null,
        email: user.email ?? null,
        role: user.role?.name ?? null,
        points: 0,
        reservations: 0,
        checkIns: 0,
        releases: 0,
        rewardPoints: 0,
        rewardCount: 0,
        plannedReservations: 0,
        earlyReservations: 0,
      });
    }

    for (const reservation of reservations) {
      const row = leaderboardMap.get(reservation.user_id);

      if (!row) {
        continue;
      }

      row.reservations += 1;
      row.points += this.getReservationPoints(reservation);

      const createdAt = new Date(reservation.createdAt);
      const startTime = new Date(reservation.start_time);

      if (startTime.getTime() - createdAt.getTime() >= 24 * 60 * 60 * 1000) {
        row.plannedReservations += 1;
      }

      if (startTime.getHours() < 10) {
        row.earlyReservations += 1;
      }
    }

    for (const usage of spaceUsages) {
      const row = leaderboardMap.get(usage.user_id);

      if (!row) {
        continue;
      }

      row.checkIns += 1;
      row.points += 15;
    }

    for (const release of releases) {
      const rewardUserId = release.reservation?.user_id;

      if (!rewardUserId) {
        continue;
      }

      const row = leaderboardMap.get(rewardUserId);

      if (!row) {
        continue;
      }

      row.releases += 1;
      row.points += 10;
    }

    const leaderboard = Array.from(leaderboardMap.values())
      .sort((left, right) => {
        if (right.points !== left.points) {
          return right.points - left.points;
        }

        return (left.full_name ?? '').localeCompare(right.full_name ?? '');
      })
      .map((row, index) => ({
        ...row,
        rank: index + 1,
      }));

    return { period, leaderboard };
  }

  async getLeaderboard(userId: number | null = null) {
    const { period, leaderboard } = await this.buildLeaderboard();
    const currentUser = userId
      ? (leaderboard.find((row) => row.user_id === userId) ?? null)
      : null;
    const rewardState = await this.getRewardState();

    return {
      period,
      leaderboard,
      currentUser,
      rewards: rewardState.rewards,
      currentRewards: rewardState.rewards.slice(0, 8),
    };
  }

  async getUserGamification(userId: number) {
    const summary = await this.getLeaderboard(userId);

    if (!summary.currentUser) {
      throw new NotFoundException('User not found');
    }

    const currentUserLevel = this.getLevel(summary.currentUser.points);

    return {
      user: {
        user_id: summary.currentUser.user_id,
        full_name: summary.currentUser.full_name,
        email: summary.currentUser.email,
        role: summary.currentUser.role,
      },
      score: {
        points: summary.currentUser.points,
        level: currentUserLevel.level,
        nextLevelPoints: currentUserLevel.nextLevelPoints,
        progress: currentUserLevel.progress,
      },
      leaderboard: summary.leaderboard,
      currentUserRank: summary.currentUser.rank,
      period: summary.period,
      rewards: summary.currentRewards,
    };
  }

  async getUsersForRewards() {
    const users = await this.userRepository.find({
      relations: ['role'],
      order: { full_name: 'ASC' },
    });

    return users.map((user) => ({
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role?.name ?? null,
    }));
  }

  async getRewards() {
    return this.getRewardState();
  }

  async createReward(createGamificationRewardDto: CreateGamificationRewardDto) {
    const reward = this.gamificationRewardRepository.create({
      title: createGamificationRewardDto.title,
      description: createGamificationRewardDto.description,
      points: createGamificationRewardDto.points,
      period_start: createGamificationRewardDto.period_start
        ? new Date(createGamificationRewardDto.period_start)
        : undefined,
      period_end: createGamificationRewardDto.period_end
        ? new Date(createGamificationRewardDto.period_end)
        : undefined,
    });

    return this.gamificationRewardRepository.save(reward);
  }

  async updateReward(
    id: number,
    updateGamificationRewardDto: UpdateGamificationRewardDto,
  ) {
    const existingReward = await this.gamificationRewardRepository.findOne({
      where: { gamification_reward_id: id },
    });

    if (!existingReward) {
      throw new NotFoundException('Reward not found');
    }

    const updateData: Partial<GamificationReward> = {
      ...updateGamificationRewardDto,
      period_start: updateGamificationRewardDto.period_start
        ? new Date(updateGamificationRewardDto.period_start)
        : existingReward.period_start,
      period_end: updateGamificationRewardDto.period_end
        ? new Date(updateGamificationRewardDto.period_end)
        : existingReward.period_end,
    };

    this.gamificationRewardRepository.merge(existingReward, updateData);

    return this.gamificationRewardRepository.save(existingReward);
  }

  async removeReward(id: number) {
    const existingReward = await this.gamificationRewardRepository.findOne({
      where: { gamification_reward_id: id },
    });

    if (!existingReward) {
      throw new NotFoundException('Reward not found');
    }

    await this.gamificationRewardRepository.remove(existingReward);

    return existingReward;
  }
}
