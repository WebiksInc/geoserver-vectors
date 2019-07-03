import { AcNotification } from 'angular-cesium';

export interface IVector {
  id: string;
  name: string;
  workspace: string;
  srs: string;
  nativeCrs: string;
  show: boolean;
  features?: AcNotification[] | any;
  polygons: AcNotification[] | any;
  lineStrings: AcNotification[] | any;
  points: AcNotification[] | any;
}
