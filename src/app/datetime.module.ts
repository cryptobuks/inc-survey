import { NgModule } from '@angular/core';
import { NgxMatDatetimePickerModule, NgxMatNativeDateModule, NgxMatTimepickerModule } from '@angular-material-components/datetime-picker';

const AllMaterialModules = [
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    NgxMatNativeDateModule
];

@NgModule({
    imports: [AllMaterialModules],
    exports: [AllMaterialModules],
})
export class DatetimeModule { }