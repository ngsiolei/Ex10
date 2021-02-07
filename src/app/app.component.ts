import { Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FormControl } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
} from 'rxjs/operators';
import { SearchService, SearchItem } from './search.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'Ex10';
  loading: boolean = false;
  results: Observable<SearchItem[]> = of([]);
  searchField: FormControl = new FormControl();
  hasError: boolean = false;
  errMsg: string = '';

  constructor(private searchService: SearchService) {}

  ngOnInit() {
    this.searchField.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => {
          this.loading = true;
        }),
        switchMap(term => this.searchService.search(term)),
        tap(() => {
          this.loading = false;
        })
      )
      .subscribe(
        (x: any) => {
          this.results = of(x);
          this.hasError = false;
          this.errMsg = '';
        },
        (err: any) => {
          this.hasError = true;
          this.errMsg = err;
        }
      );
    this.searchField.setValue('');
  }
}
