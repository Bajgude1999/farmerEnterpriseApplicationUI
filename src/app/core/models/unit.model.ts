export interface UnitOption {
  unitCd?: number;
  unitName: string;
  unitShortName?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type Unit = UnitOption;