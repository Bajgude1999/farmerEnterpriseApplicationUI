import { Injectable, signal } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  searchResults = signal<Product[]>([]);
}