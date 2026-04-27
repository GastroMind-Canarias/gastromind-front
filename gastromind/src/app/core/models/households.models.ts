import { Allergen } from './users.models';

export interface HouseholdMember {
  id: string;
  name: string;
  email: string;
  houseHold_id: string;
  role: string;
  allergens: Allergen[];
}

export interface Household {
  id: string;
  name: string;
  membersCount: number;
  members: HouseholdMember[];
  appliances: string[];
}

export type Appliance =
  | 'HORNO'
  | 'MICROONDAS'
  | 'AIR_FRYER'
  | 'VITROCERAMICA'
  | 'ROBOT_COCINA'
  | 'BATIDORA'
  | 'OLLA_EXPRESS';

export const APPLIANCE_LABELS: Record<Appliance, string> = {
  HORNO:         'Horno',
  MICROONDAS:    'Microondas',
  AIR_FRYER:     'Air Fryer',
  VITROCERAMICA: 'Vitrocerámica',
  ROBOT_COCINA:  'Robot de Cocina',
  BATIDORA:      'Batidora',
  OLLA_EXPRESS:  'Olla Express',
};

export const ALL_APPLIANCES: Appliance[] = [
  'HORNO', 'MICROONDAS', 'AIR_FRYER', 'VITROCERAMICA',
  'ROBOT_COCINA', 'BATIDORA', 'OLLA_EXPRESS',
];
