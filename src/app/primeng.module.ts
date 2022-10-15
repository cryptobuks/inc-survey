import { NgModule } from "@angular/core";
import { TimelineModule } from "primeng/timeline";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { PanelMenuModule } from 'primeng/panelmenu';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SidebarModule } from 'primeng/sidebar';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { PanelModule } from 'primeng/panel';
import { DialogModule } from 'primeng/dialog';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RatingModule } from 'primeng/rating';
import { SliderModule } from 'primeng/slider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from "primeng/api";
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import { PaginatorModule } from 'primeng/paginator';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TabViewModule } from 'primeng/tabview';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';
import { ChipsModule } from 'primeng/chips';

const AllPrimeNGModules = [
    TimelineModule,
    CardModule,
    ButtonModule,
    PanelMenuModule,
    DividerModule,
    InputNumberModule,
    SelectButtonModule,
    SidebarModule,
    OverlayPanelModule,
    PanelModule,
    DialogModule,
    ToggleButtonModule,
    TooltipModule,
    InputTextModule,
    ProgressSpinnerModule,
    RatingModule,
    SliderModule,
    ToastModule,
    ConfirmPopupModule,
    PaginatorModule,
    DropdownModule,
    MultiSelectModule,
    TagModule,
    CalendarModule,
    CheckboxModule,
    RadioButtonModule,
    InputTextareaModule,
    TabViewModule,
    ConfirmDialogModule,
    MessagesModule,
    MessageModule,
    ChipsModule
];

@NgModule({
  imports: [AllPrimeNGModules],
  exports: [AllPrimeNGModules],
  providers: [MessageService, ConfirmationService]
})
export class PrimeNGModule {}