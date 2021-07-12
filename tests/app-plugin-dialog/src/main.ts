import { Aurelia, PLATFORM } from 'aurelia-framework';

export async function configure(aurelia: Aurelia) {
  aurelia.use
    .basicConfiguration()
    .plugin(PLATFORM.moduleName('aurelia-dialog'));

  await aurelia.start();
  await aurelia.setRoot(PLATFORM.moduleName('app'));
}
