import { inject } from 'aurelia-dependency-injection';
// import { DialogService } from 'aurelia-dialog';
import { Store } from 'aurelia-store';
  
@inject(Store)
// @inject(DialogService)
export class App {
  appDate: Date = new Date();
  subscription: any;
  state: any;
  // constructor(public service: DialogService) {}
  constructor(readonly store: Store<any>) {}
 
  bind() {
    this.subscription = this.store.state.subscribe(
      (state) => this.state = state
    );
  }

  attached() {
    // this.service.open({
    //   viewModel: class {
    //     static $view = '<template>Hello world</template>';
    //   }
    // });
  }
}