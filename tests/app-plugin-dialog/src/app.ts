import { inject } from 'aurelia-dependency-injection';
import { DialogService } from 'aurelia-dialog';

@inject(DialogService)
export class App {
  appDate: Date = new Date();

  constructor(public service: DialogService) {}

  attached() {
    this.service.open({
      viewModel: class {
        static $view = '<template>Hello world</template>';
      }
    });
  }
}