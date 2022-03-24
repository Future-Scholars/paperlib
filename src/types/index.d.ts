import { EntityInteractor } from 'src/interactors/entity-interactor';
import { SystemInteractor } from 'src/interactors/system-interactor';

declare global {
  interface Window {
    entityInteractor: EntityInteractor;
    systemInteractor: SystemInteractor;
  }
}
