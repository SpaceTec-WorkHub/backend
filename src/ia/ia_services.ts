import { Injectable, InternalServerErrorException } from '@nestjs/common';

export interface IARecommendation {
  space_id: number;
  location: string;
  recommendation_score: number;
}

@Injectable()
export class ParkingService {

  private readonly azureUrl = 'https://spacemodel-cmh9f8ggbxehgxbe.canadacentral-01.azurewebsites.net/api/recommend';

  async getAiRecommendations(): Promise<IARecommendation[]> {
    try {
      
      const response = await fetch(this.azureUrl);
      if (!response.ok) {
        throw new Error(`Azure respondió con estatus: ${response.status}`);
      }

      const data = await response.json() as IARecommendation[];
      return data;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Error al obtener predicciones de Azure: ${error.message}`,
      );
    }
  }
}