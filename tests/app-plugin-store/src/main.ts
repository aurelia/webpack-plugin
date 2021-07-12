import { Aurelia, PLATFORM } from 'aurelia-framework';

export async function configure(aurelia: Aurelia) {
  aurelia.use
    .basicConfiguration()
    .plugin(PLATFORM.moduleName("aurelia-store"), {
      initialState: {
        locations: ['Uluru', 'Wilson Promp', 'Yarra Range']
      },
      history: {
          undoable: false,
          limit: 4,
      },
    })
    // .plugin(PLATFORM.moduleName('aurelia-dialog'));

  await aurelia.start();
  await aurelia.setRoot(PLATFORM.moduleName('app'));
}
