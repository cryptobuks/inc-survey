import { Injectable } from "@angular/core";
import { NativeDateAdapter } from "@angular/material/core";

@Injectable({
    providedIn: 'root'
})
export class CustomDateAdapter extends NativeDateAdapter {

    createDate(year: number, month: number, date: number): Date {
        const localDate = super.createDate(year, month, date);
        const offset = localDate.getTimezoneOffset() * 60000;
        return new Date(localDate.getTime() - offset); // utcDate
    }
}