import { PartialType } from '@nestjs/mapped-types';
import { CreateGamificationRewardDto } from './create-gamification-reward.dto';

export class UpdateGamificationRewardDto extends PartialType(
  CreateGamificationRewardDto,
) {}
