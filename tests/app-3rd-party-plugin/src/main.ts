import { Aurelia, PLATFORM } from 'aurelia-framework';

export async function configure(aurelia: Aurelia) {
  try {
    aurelia.use
      .standardConfiguration()
      .plugin(PLATFORM.moduleName('aurelia-chart'));

    await aurelia.start();
    await aurelia.setRoot(PLATFORM.moduleName('app'));
  } catch (ex) {
    document.body.textContent = ex.message + '\n' + ex.stack;
  }
}
