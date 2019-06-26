import { Observable } from 'rxjs';
import { AcNotification } from 'angular-cesium';

export class Vector {
  id: string;
  name: string;
  workspace: string;
  show: boolean;
  features: AcNotification[] | any ;
  // features$?: Observable<any>;
}
