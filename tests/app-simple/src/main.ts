import { Aurelia, PLATFORM } from 'aurelia-framework';

export async function configure(aurelia: Aurelia) {
  aurelia.use
    .basicConfiguration();

  await aurelia.start();
  await aurelia.setRoot(PLATFORM.moduleName('app'));
}
