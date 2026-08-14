import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class AppDateAdapter extends NativeDateAdapter {

  override format(
    date: Date,
    displayFormat: unknown
  ): string {

    if (!date || isNaN(date.getTime())) {
      return '';
    }

    const day = date
      .getDate()
      .toString()
      .padStart(2, '0');

    const month = (date.getMonth() + 1)
      .toString()
      .padStart(2, '0');

    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }


  override parse(
    value: unknown
  ): Date | null {

    if (typeof value !== 'string') {
      return null;
    }

    const parts = value
      .trim()
      .split('/');

    if (parts.length !== 3) {
      return null;
    }

    const day = Number(parts[0]);
    const month = Number(parts[1]);
    const year = Number(parts[2]);

    if (
      !Number.isInteger(day) ||
      !Number.isInteger(month) ||
      !Number.isInteger(year)
    ) {
      return null;
    }

    const date = new Date(
      year,
      month - 1,
      day
    );

    // Validate date
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

}