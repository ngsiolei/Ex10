import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { FormControl } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  startWith,
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
  title: string = 'Ex10';
  loading: boolean = false;
  results: Observable<SearchItem[]> = of([]);
  searchField: FormControl = new FormControl();
  hasError: boolean = false;
  errMsg: string = '';
  sortSubject: BehaviorSubject<string> = new BehaviorSubject('');
  sortParam: string = 'name_asc';

  constructor(private searchService: SearchService) {}

  ngOnInit() {
    combineLatest(
      this.searchField.valueChanges.pipe(
        startWith(''),
        debounceTime(400),
        distinctUntilChanged()
      ),
      this.sortSubject
    )
      .pipe(
        tap(() => {
          this.loading = true;
        }),
        switchMap(([term, sort]) => {
          return this.searchService.search(term, sort);
        })
      )
      .subscribe({
        next: (x: any) => {
          this.results = of(x);
          this.hasError = false;
          this.errMsg = '';
          this.loading = false;
        },
        error: (err: any) => {
          this.hasError = true;
          this.errMsg = err;
          this.loading = false;
        },
      });
  }

  private sort(sortKey: 'name' | 'car' | 'mb') {
    const key = this.sortParam.split('_')[0];
    const order = this.sortParam.split('_')[1];
    this.sortParam = [
      sortKey,
      sortKey !== key ? 'desc' : 'asc' === order ? 'desc' : 'asc',
    ].join('_');
    this.sortSubject.next(this.sortParam);
  }

  sortByName() {
    this.sort('name');
  }

  sortByCar() {
    this.sort('car');
  }

  sortByMb() {
    this.sort('mb');
  }
}
