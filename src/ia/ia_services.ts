import { Injectable, InternalServerErrorException } from '@nestjs/common';

export interface IARecommendation {
  parking_recommendation: {
    space_id: number;
    space_code: string;
    zone_name: string;
    best_day_to_attend: string;
    affinity_probability: number;
  };
  workspace_recommendation: {
    space_id: number;
    space_code: string;
    zone_name: string;
    best_day_to_attend: string;
    affinity_probability: number;
  };
}

export interface GlobalDayRanking {
  position: number;
  day_id: number;
  day_name: string;
  estimated_traffic_index: number;
}

export interface IAGlobalRecommendation {
  resource_type_id: number;
  resource_name: string;
  best_days_to_attend_ranking: GlobalDayRanking[];
}

@Injectable()
export class ParkingService {
  private readonly azureUrl = 'https://spacemodel-cmh9f8ggbxehgxbe.canadacentral-01.azurewebsites.net/api/recommend';
  private readonly azureGlobalUrl = 'https://spacemodel-cmh9f8ggbxehgxbe.canadacentral-01.azurewebsites.net/api/global_recommend';

  async getAiRecommendations(userId: number): Promise<IARecommendation> {
    try {
      const response = await fetch(this.azureUrl, {
        headers: { 'user-id': String(userId) }
      });
      if (!response.ok) throw new Error(`Azure respondió con estatus: ${response.status}`);
      return await response.json() as IARecommendation;
    } catch (error: any) {
      throw new InternalServerErrorException(`Error al obtener predicciones de Azure: ${error.message}`);
    }
  }

  async getGlobalDayRecommendations(resourceTypeId: number): Promise<IAGlobalRecommendation> {
    try {
      const response = await fetch(`${this.azureGlobalUrl}?tipo=${resourceTypeId}`);
      if (!response.ok) throw new Error(`Azure respondió con estatus: ${response.status}`);
      return await response.json() as IAGlobalRecommendation;
    } catch (error: any) {
      throw new InternalServerErrorException(`Error al obtener el ranking global de días desde Azure: ${error.message}`);
    }
  }
}