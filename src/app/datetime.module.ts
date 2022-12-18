import { NgModule } from '@angular/core';
import { NgxMatDateFormats, NgxMatDatetimePickerModule, NgxMatNativeDateModule, NgxMatTimepickerModule, NGX_MAT_DATE_FORMATS } from '@angular-material-components/datetime-picker';

const AllMaterialModules = [
    NgxMatDatetimePickerModule,
    NgxMatTimepickerModule,
    NgxMatNativeDateModule
];

const INTL_DATE_INPUT_FORMAT = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
};

const MAT_DATE_FORMATS: NgxMatDateFormats = {
    parse: {
      dateInput: INTL_DATE_INPUT_FORMAT,
    },
    display: {
      dateInput: INTL_DATE_INPUT_FORMAT,
      monthYearLabel: { year: 'numeric', month: 'short' },
      dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
      monthYearA11yLabel: { year: 'numeric', month: 'long' },
    },
  };

@NgModule({
    imports: [AllMaterialModules],
    exports: [AllMaterialModules],
    providers: [
        { provide: NGX_MAT_DATE_FORMATS, useValue: MAT_DATE_FORMATS }
    ]
})
export class DatetimeModule { }