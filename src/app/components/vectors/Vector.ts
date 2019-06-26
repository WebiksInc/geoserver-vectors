import { AcNotification } from 'angular-cesium';

export class Vector {
  id: string;
  name: string;
  workspace: string;
  show: boolean;
  features?: AcNotification[] | any;
  polygons: AcNotification[] | any;
  lineStrings: AcNotification[] | any;
  points: AcNotification[] | any;
}
