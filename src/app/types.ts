import { AcNotification } from 'angular-cesium';

export interface IWorkspace {
  name: string;
  datastores: IHref[];
}

export interface IVector {
  id: string;
  name: string;
  workspace: string;
  srs: string;
  nativeCrs: string;
  show?: boolean;
  features: AcNotification[] | any;
  polygons?: AcNotification[] | any;
  lineStrings?: AcNotification[] | any;
  points?: AcNotification[] | any;
}

export interface IHref {
  name: string;
  href: string;
}

export type IPoint = [number, number];
