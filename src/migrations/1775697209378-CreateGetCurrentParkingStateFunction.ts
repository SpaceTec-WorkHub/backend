import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGetCurrentParkingStateFunction1775697209378 implements MigrationInterface {
    name = 'CreateGetCurrentParkingStateFunction1775697209378'

    public async up(queryRunner: QueryRunner): Promise<void> {
        
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION public.get_current_parking_state()
            RETURNS TABLE(
                space_id INT,
                location VARCHAR,
                current_day VARCHAR,
                current_status VARCHAR,
                current_hour INT,
                incidents_today INT
            ) 
            LANGUAGE plpgsql
            AS $function$
            BEGIN
                RETURN QUERY
                SELECT 
                    s.space_id,
                    s.location,
                    -- Obtenemos el nombre del día actual (ej: 'Saturday')
                    TRIM(TO_CHAR(NOW(), 'Day'))::VARCHAR AS current_day,
                    s.status::VARCHAR AS current_status,
                    -- Obtenemos la hora actual del servidor como entero
                    EXTRACT(HOUR FROM NOW())::INT AS current_hour,
                    -- Contamos los incidentes del espacio registrados el día de hoy
                    COALESCE(COUNT(i.incident_id), 0)::INT AS incidents_today
                FROM 
                    public.space s
                LEFT JOIN 
                    public.incident i ON i.space_id = s.space_id 
                    AND i."createdAt"::DATE = NOW()::DATE
                GROUP BY 
                    s.space_id, s.location, s.status;
            END;
            $function$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP FUNCTION IF EXISTS public.get_current_parking_state();`);
    }
}