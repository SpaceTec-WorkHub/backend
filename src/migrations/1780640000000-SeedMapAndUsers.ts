import { MigrationInterface, QueryRunner } from 'typeorm';
import bcrypt from 'bcrypt';

const PASSWORD_SALT_ROUNDS = 12;

const SITE_NAME = 'Campus Monterrey';
const BUILDING_NAME = 'Edificio CEDES';

const SPACE_TYPES = ['Escritorio', 'Sala de juntas', 'Cajón de estacionamiento', 'Espacio común'] as const;

type RoomSpec = { zoneName: string; code: string; type: 'Sala de juntas' | 'Espacio común' };

type DeskZoneSpec = { name: string; codes: string[]; accessible?: string[]; priority?: string[] };

type OfficeFloorSpec = {
  name: string;
  deskZones: DeskZoneSpec[];
  rooms: RoomSpec[];
};

type ParkingFloorSpec = {
  name: string;
  zones: DeskZoneSpec[];
};

const USERS = [
  { full_name: 'Andrea Castillo Ramírez', email: 'andrea.castillo@workhub.mx', role: 'admin' as const },
  { full_name: 'Diego Hernández Flores', email: 'diego.hernandez@workhub.mx', role: 'employee' as const },
  { full_name: 'Mariana López Torres', email: 'mariana.lopez@workhub.mx', role: 'employee' as const },
  { full_name: 'Carlos Ramírez Soto', email: 'carlos.ramirez@workhub.mx', role: 'employee' as const },
  { full_name: 'Fernanda Gutiérrez Mendoza', email: 'fernanda.gutierrez@workhub.mx', role: 'employee' as const },
  { full_name: 'Roberto Sánchez Villanueva', email: 'roberto.sanchez@workhub.mx', role: 'employee' as const },
  { full_name: 'Paola Jiménez Vázquez', email: 'paola.jimenez@workhub.mx', role: 'employee' as const },
  { full_name: 'Luis García Ortiz', email: 'luis.garcia@workhub.mx', role: 'employee' as const },
  { full_name: 'Daniela Morales Cervantes', email: 'daniela.morales@workhub.mx', role: 'employee' as const },
  { full_name: 'Jorge Treviño Garza', email: 'jorge.trevino@workhub.mx', role: 'employee' as const },
];

const ADMIN_PASSWORD = 'Admin#2026';
const EMPLOYEE_PASSWORD = 'WorkHub2026!';

// Genera codigos consecutivos tipo PB001..PB071, MZ021..MZ114, IC3006..IC3039, 9001..9086, etc.
function codeRange(prefix: string, start: number, end: number, pad = 0): string[] {
  const codes: string[] = [];
  for (let n = start; n <= end; n++) {
    codes.push(`${prefix}${pad ? String(n).padStart(pad, '0') : n}`);
  }
  return codes;
}

// Distribución basada en los planos PISO PB / MZ / 3 / 9 (codigos de escritorios y salas con nombre)
const OFFICE_FLOORS: OfficeFloorSpec[] = [
  {
    name: 'Planta Baja',
    deskZones: [
      { name: 'Planta Baja - Ala Norte', codes: codeRange('PB', 1, 35, 3), accessible: ['PB001'], priority: ['PB002'] },
      { name: 'Planta Baja - Ala Sur', codes: codeRange('PB', 36, 71, 3) },
    ],
    rooms: [
      { zoneName: 'Monterrey', code: 'PBSJ-076', type: 'Sala de juntas' },
      { zoneName: 'La Huasteca', code: 'PBSJ-077', type: 'Sala de juntas' },
      { zoneName: 'Fundidora', code: 'PBSJ-078', type: 'Sala de juntas' },
      { zoneName: 'Phone Booth 1 - PB', code: 'PBPB-079', type: 'Espacio común' },
      { zoneName: 'Phone Booth 2 - PB', code: 'PBPB-080', type: 'Espacio común' },
      { zoneName: 'Phone Booth 3 - PB', code: 'PBPB-081', type: 'Espacio común' },
      { zoneName: 'Media Scape 1 - PB', code: 'PBMS-082', type: 'Espacio común' },
      { zoneName: 'Media Scape 2 - PB', code: 'PBMS-083', type: 'Espacio común' },
      { zoneName: 'Sala de Bienestar', code: 'PBW-073', type: 'Espacio común' },
    ],
  },
  {
    name: 'Mezzanine',
    deskZones: [
      { name: 'Mezzanine - Ala Norte', codes: codeRange('MZ', 21, 67, 3), accessible: ['MZ021'], priority: ['MZ022'] },
      { name: 'Mezzanine - Ala Sur', codes: codeRange('MZ', 68, 114, 3) },
    ],
    rooms: [
      { zoneName: 'Mitras', code: 'MZSJ-115', type: 'Sala de juntas' },
      { zoneName: 'Chipinque', code: 'MZSJ-116', type: 'Sala de juntas' },
      { zoneName: 'Santa Lucía', code: 'MZSJ-117', type: 'Sala de juntas' },
      { zoneName: 'Media Scape - MZ', code: 'MZMS-119', type: 'Espacio común' },
      { zoneName: 'Sala Multiusos MZ120', code: 'MZC1u-120', type: 'Espacio común' },
    ],
  },
  {
    name: 'Piso 3',
    deskZones: [
      { name: 'Piso 3 - Ala Norte', codes: codeRange('IC', 3006, 3022), accessible: ['IC3006'], priority: ['IC3007'] },
      { name: 'Piso 3 - Ala Sur', codes: codeRange('IC', 3023, 3039) },
    ],
    rooms: [
      { zoneName: 'Sierra Madre', code: 'ICSJ-3040', type: 'Sala de juntas' },
      { zoneName: 'La Silla', code: 'ICSJ-3041', type: 'Sala de juntas' },
      { zoneName: 'Sala de Lactancia', code: 'ICSL-3044', type: 'Sala de juntas' },
      { zoneName: 'Comedor 1', code: 'ICC-3045', type: 'Espacio común' },
      { zoneName: 'Comedor 2', code: 'ICC1u-3048', type: 'Espacio común' },
      { zoneName: 'Lounge - Piso 3', code: 'ICL-3047', type: 'Espacio común' },
      { zoneName: 'Oficina Privada 3043', code: 'ICOL-3043', type: 'Espacio común' },
    ],
  },
  {
    name: 'Piso 9',
    deskZones: [
      { name: 'Piso 9 - Ala Norte', codes: codeRange('', 9001, 9043), accessible: ['9001'], priority: ['9002'] },
      { name: 'Piso 9 - Ala Sur', codes: codeRange('', 9044, 9086) },
    ],
    rooms: [
      { zoneName: 'Estanzuela', code: 'SJ-9087', type: 'Sala de juntas' },
      { zoneName: 'Área Colaborativa', code: 'SJ-9088', type: 'Sala de juntas' },
      { zoneName: 'Work Lab 01', code: 'WL-9089', type: 'Sala de juntas' },
      { zoneName: 'Work Lab 02', code: 'WL-9090', type: 'Sala de juntas' },
      { zoneName: 'Área de Demo', code: 'AC-9091', type: 'Sala de juntas' },
      { zoneName: 'Phone Booth 1 - Piso 9', code: 'PB-9093', type: 'Espacio común' },
      { zoneName: 'Phone Booth 2 - Piso 9', code: 'PB-9094', type: 'Espacio común' },
      { zoneName: 'Sala Multiusos 9095', code: 'C1u-9095', type: 'Espacio común' },
    ],
  },
];

// 2 pisos de estacionamiento simulados, divididos en zona norte/sur
const PARKING_FLOORS: ParkingFloorSpec[] = [
  {
    name: 'Estacionamiento Nivel 1',
    zones: [
      { name: 'Estacionamiento N1 - Zona Norte', codes: codeRange('EN1-N', 1, 15, 2), accessible: ['EN1-N01', 'EN1-N02'] },
      { name: 'Estacionamiento N1 - Zona Sur', codes: codeRange('EN1-S', 1, 15, 2) },
    ],
  },
  {
    name: 'Estacionamiento Nivel 2',
    zones: [
      { name: 'Estacionamiento N2 - Zona Norte', codes: codeRange('EN2-N', 1, 15, 2), accessible: ['EN2-N01', 'EN2-N02'] },
      { name: 'Estacionamiento N2 - Zona Sur', codes: codeRange('EN2-S', 1, 15, 2) },
    ],
  },
];

export class SeedMapAndUsers1780640000000 implements MigrationInterface {
  name = 'SeedMapAndUsers1780640000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Tipos de espacio ──────────────────────────────────────────────
    const spaceTypeRows: { space_type_id: number; name: string }[] = await queryRunner.query(
      `INSERT INTO "space_type" (name) VALUES ($1), ($2), ($3), ($4) RETURNING space_type_id, name`,
      [...SPACE_TYPES],
    );
    const typeId = new Map(spaceTypeRows.map((r) => [r.name, r.space_type_id]));

    // ── Jerarquía site / building ────────────────────────────────────
    const [site] = await queryRunner.query(
      `INSERT INTO "site" (name) VALUES ($1) RETURNING site_id`,
      [SITE_NAME],
    );
    const [building] = await queryRunner.query(
      `INSERT INTO "building" (name, site_id) VALUES ($1, $2) RETURNING building_id`,
      [BUILDING_NAME, site.site_id],
    );

    // ── Pisos de oficina (PB, Mezzanine, Piso 3, Piso 9) ─────────────
    for (const floorSpec of OFFICE_FLOORS) {
      const [floor] = await queryRunner.query(
        `INSERT INTO "floor" (name, building_id, floor_type) VALUES ($1, $2, 'office') RETURNING floor_id`,
        [floorSpec.name, building.building_id],
      );

      for (const deskZone of floorSpec.deskZones) {
        const zoneId = await this.insertZone(queryRunner, deskZone.name, floor.floor_id);
        await this.insertSpaces(
          queryRunner,
          zoneId,
          typeId.get('Escritorio')!,
          deskZone.codes,
          deskZone.accessible,
          deskZone.priority,
        );
      }

      for (const room of floorSpec.rooms) {
        const zoneId = await this.insertZone(queryRunner, room.zoneName, floor.floor_id);
        await this.insertSpaces(queryRunner, zoneId, typeId.get(room.type)!, [room.code]);
      }
    }

    // ── Pisos de estacionamiento simulados ───────────────────────────
    for (const floorSpec of PARKING_FLOORS) {
      const [floor] = await queryRunner.query(
        `INSERT INTO "floor" (name, building_id, floor_type) VALUES ($1, $2, 'parking') RETURNING floor_id`,
        [floorSpec.name, building.building_id],
      );

      for (const zoneSpec of floorSpec.zones) {
        const zoneId = await this.insertZone(queryRunner, zoneSpec.name, floor.floor_id);
        await this.insertSpaces(
          queryRunner,
          zoneId,
          typeId.get('Cajón de estacionamiento')!,
          zoneSpec.codes,
          zoneSpec.accessible,
          zoneSpec.priority,
        );
      }
    }

    // ── Roles y usuarios de demo ─────────────────────────────────────
    const [adminRole] = await queryRunner.query(
      `INSERT INTO "role" (name) VALUES ($1) RETURNING role_id`,
      ['admin'],
    );
    const [employeeRole] = await queryRunner.query(
      `INSERT INTO "role" (name) VALUES ($1) RETURNING role_id`,
      ['employee'],
    );
    const roleId = { admin: adminRole.role_id, employee: employeeRole.role_id };

    const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, PASSWORD_SALT_ROUNDS);
    const employeePasswordHash = await bcrypt.hash(EMPLOYEE_PASSWORD, PASSWORD_SALT_ROUNDS);

    for (const user of USERS) {
      const passwordHash = user.role === 'admin' ? adminPasswordHash : employeePasswordHash;
      await queryRunner.query(
        `INSERT INTO "user" (email, password, full_name, user_type, status, role_id) VALUES ($1, $2, $3, 'internal', 'active', $4)`,
        [user.email, passwordHash, user.full_name, roleId[user.role]],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "user" WHERE email = ANY($1)`,
      [USERS.map((u) => u.email)],
    );
    await queryRunner.query(`DELETE FROM "role" WHERE name IN ('admin', 'employee')`);

    const [building] = await queryRunner.query(
      `SELECT building_id FROM "building" WHERE name = $1 AND site_id IN (SELECT site_id FROM "site" WHERE name = $2)`,
      [BUILDING_NAME, SITE_NAME],
    );

    if (building) {
      await queryRunner.query(
        `DELETE FROM "space" WHERE zone_id IN (
          SELECT zone_id FROM "zone" WHERE floor_id IN (
            SELECT floor_id FROM "floor" WHERE building_id = $1
          )
        )`,
        [building.building_id],
      );
      await queryRunner.query(
        `DELETE FROM "zone" WHERE floor_id IN (SELECT floor_id FROM "floor" WHERE building_id = $1)`,
        [building.building_id],
      );
      await queryRunner.query(`DELETE FROM "floor" WHERE building_id = $1`, [building.building_id]);
      await queryRunner.query(`DELETE FROM "building" WHERE building_id = $1`, [building.building_id]);
    }

    await queryRunner.query(`DELETE FROM "site" WHERE name = $1`, [SITE_NAME]);
    await queryRunner.query(
      `DELETE FROM "space_type" WHERE name = ANY($1)`,
      [[...SPACE_TYPES]],
    );
  }

  private async insertZone(queryRunner: QueryRunner, name: string, floorId: number): Promise<number> {
    const [row] = await queryRunner.query(
      `INSERT INTO "zone" (name, floor_id) VALUES ($1, $2) RETURNING zone_id`,
      [name, floorId],
    );
    return row.zone_id;
  }

  private async insertSpaces(
    queryRunner: QueryRunner,
    zoneId: number,
    spaceTypeId: number,
    codes: string[],
    accessible: string[] = [],
    priority: string[] = [],
  ): Promise<void> {
    if (codes.length === 0) return;

    const accessibleSet = new Set(accessible);
    const prioritySet = new Set(priority);
    const placeholders: string[] = [];
    const params: unknown[] = [];

    codes.forEach((code, idx) => {
      const base = idx * 5;
      placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, 'available', $${base + 4}, $${base + 5})`);
      params.push(code, accessibleSet.has(code), prioritySet.has(code), spaceTypeId, zoneId);
    });

    await queryRunner.query(
      `INSERT INTO "space" (code, is_accessible, is_priority, status, space_type_id, zone_id) VALUES ${placeholders.join(', ')}`,
      params,
    );
  }
}
