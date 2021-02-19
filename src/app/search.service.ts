import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, bindNodeCallback } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { parseString } from 'xml2js';
import env from './env.json';

export class SearchItem {
  constructor(
    public id: string,
    public nameCht: string,
    public nameEng: string,
    public namePor: string,
    public car: string,
    public mb: string,
    public inMaintenance: string,
    public updatedAt: string
  ) {}
}

@Injectable()
export class SearchService {
  headers: HttpHeaders = new HttpHeaders().set(
    'Authorization',
    `APPCODE ${env.apiKey}`
  );
  cache = {
    items: [],
    updatedAt: 0,
  };

  constructor(private http: HttpClient) {}

  private fetchIfNeeded(): Observable<SearchItem[]> {
    if (
      0 !== this.cache.updatedAt &&
      Date.now() - this.cache.updatedAt < env.cacheLifetime
    ) {
      return of(this.cache.items);
    }
    return this.http
      .get(env.apiUrl, { headers: this.headers, responseType: 'text' })
      .pipe(
        switchMap((raw: string) => {
          return bindNodeCallback(parseString)(raw);
        }),
        map((res: any) => {
          const items = res.CarPark.Car_park_info.map((item: any) => {
            return new SearchItem(
              item.$.ID,
              item.$.name,
              item.$.CP_EName,
              item.$.CP_PName,
              item.$.Car_CNT,
              item.$.MB_CNT,
              item.$.maintenance,
              item.$.time
            );
          });
          this.cache.items = items;
          this.cache.updatedAt = Date.now();
          return items;
        }),
        catchError((err: any) => {
          throw '未能下載資料!';
        })
      );
  }

  search(term: string): Observable<SearchItem[]> {
    return this.fetchIfNeeded().pipe(
      map((items: SearchItem[]) => {
        return items.filter((item: SearchItem) => {
          const termTrimmed = term.replace(/(^\s+)|(\s+$)/g, '');
          if (termTrimmed) {
            return (
              -1 !== item.nameCht.indexOf(termTrimmed) &&
              '0' === item.inMaintenance
            );
          }
          return '0' === item.inMaintenance;
        });
      })
    );
  }
}
