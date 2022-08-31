import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'app-generic-snack-bar',
  templateUrl: './generic-snack-bar.component.html',
  styleUrls: ['./generic-snack-bar.component.css']
})
export class GenericSnackBarComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) { }
}
