/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 */
import { contextBridge } from 'electron';

import { SharedState } from '../src/interactors/app-state';
import { Preference } from '../src/utils/preference';
import { EntityInteractor } from '../src/interactors/entity-interactor';
import { SystemInteractor } from '../src/interactors/system-interactor';

const sharedState = new SharedState();
const preference = new Preference();

const entityInteractor = new EntityInteractor(sharedState, preference);
const systemInteractor = new SystemInteractor(sharedState, preference);

function createInteractorProxy(interactor) {
  const interactorFuncs = Object.getOwnPropertyNames(interactor.__proto__);
  const interactorProps = Object.getOwnPropertyNames(interactor);

  const interactorProxy = {};
  for (let func of interactorFuncs) {
    if (func === 'constructor') {
      continue;
    }
    interactorProxy[func] = interactor[func].bind(interactor);
  }

  for (let prop of interactorProps) {
    if (prop === 'constructor') {
      continue;
    }
    interactorProxy[prop] = interactor[prop];
  }

  return interactorProxy;
}

const entityInteractorProxy = createInteractorProxy(entityInteractor);
const systemInteractorProxy = createInteractorProxy(systemInteractor);

contextBridge.exposeInMainWorld('entityInteractor', entityInteractorProxy);
contextBridge.exposeInMainWorld('systemInteractor', systemInteractorProxy);
