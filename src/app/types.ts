import { AcNotification } from 'angular-cesium';

export interface IWorkspace {
  name: string;
  datastores: IHref[];
  vectors?: IVector[];
}

export interface IVector {
  workspace: string;
  id: string;
  name: string;
  srs: string;
  nativeCrs: string;
  show: boolean;
  features: AcNotification[] | any;
  polygons: AcNotification[] | any;
  lineStrings: AcNotification[] | any;
  points: AcNotification[] | any;
}

export interface IHref {
  name: string;
  href: string;
}

export type IPoint = [number, number];
