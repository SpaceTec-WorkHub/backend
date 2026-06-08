import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateObtenerDatosOcupacion41717454400000 implements MigrationInterface {
    name = 'CreateObtenerDatosOcupacion41717454400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION public.obtener_datos_ocupacion4()
            RETURNS TABLE(
                space_id INT,
                space_code VARCHAR,
                zone_name VARCHAR,
                space_type_id INT
            ) 
            LANGUAGE plpgsql
            AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    s.id AS space_id,
                    s.code AS space_code,
                    z.name AS zone_name,
                    s.space_type_id AS space_type_id
                FROM 
                    public.spaces s
                LEFT JOIN 
                    public.zones z ON s.zone_id = z.id
                WHERE 
                    s.active = TRUE;
            END;
            $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP FUNCTION IF EXISTS public.obtener_datos_ocupacion4();
        `);
    }
}