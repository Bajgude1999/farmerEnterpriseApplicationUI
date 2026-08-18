export interface State {
  stateCd: number;
  stateName: string;
}

export interface District {
  districtCd: number;
  districtName: string;
  stateCd: number;
}

export interface Taluka {
  talukaCd: number;
  talukaName: string;
  districtCd: number;
}