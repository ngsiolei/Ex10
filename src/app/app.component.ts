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
    this.searchService.search('').subscribe(
      x => {
        this.results = of(x);
      },
      err => {
        this.hasError = true;
        this.errMsg = err;
      }
    );
    this.searchField.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => (this.loading = true)),
        switchMap(term => this.searchService.search(term)),
        tap(() => (this.loading = false))
      )
      .subscribe(
        x => {
          console.log('debug');
          this.results = of(x);
        },
        err => {
          this.hasError = true;
          this.errMsg = err;
        }
      );
  }
}
