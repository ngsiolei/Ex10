import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { combineLatest, Observable, of, bindNodeCallback } from 'rxjs';
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
    public updatedAt: string,
    public districtCht: string,
    public districtEng: string,
    public districtPor: string
  ) {}
}

@Injectable()
export class SearchService {
  headers: HttpHeaders = new HttpHeaders().set(
    'Authorization',
    `APPCODE ${env.apiKey}`
  );
  lotsCache = {
    items: [],
    updatedAt: 0,
  };
  metaCache = {
    items: {},
    updatedAt: 0,
  };

  constructor(private http: HttpClient) {}

  private fetchMetaIfNeeded() {
    if (
      0 !== this.metaCache.updatedAt &&
      Date.now() - this.metaCache.updatedAt < env.cacheMetaLifetime
    ) {
      return of(this.metaCache.items);
    }
    return this.http
      .get(env.apiMetaUrl, { headers: this.headers, responseType: 'text' })
      .pipe(
        switchMap((raw: string) => {
          return bindNodeCallback(parseString)(raw, {});
        }),
        map((res: any) => {
          const items = res.CarPark.Car_park_info.reduce(
            (result: any, item: any) => {
              result[item.$.CP_ID] = {
                districtCht: item.$.subdistrict_C,
                districtEng: item.$.subdistrict_E,
                districtPor: item.$.subdistrict_P,
              };
              return result;
            },
            {}
          );
          this.metaCache.items = items;
          this.metaCache.updatedAt = Date.now();
          return items;
        }),
        catchError((err: any) => {
          throw '未能下載資料!';
        })
      );
  }

  private fetchLotsIfNeeded(): Observable<SearchItem[]> {
    if (
      0 !== this.lotsCache.updatedAt &&
      Date.now() - this.lotsCache.updatedAt < env.cacheLotsLifetime
    ) {
      return of(this.lotsCache.items);
    }
    return combineLatest(
      this.fetchMetaIfNeeded(),
      this.http
        .get(env.apiLotsUrl, { headers: this.headers, responseType: 'text' })
        .pipe(
          switchMap((raw: string) => {
            return bindNodeCallback(parseString)(raw, {});
          })
        )
    ).pipe(
      map(([meta, res]: [any, any]) => {
        const items = res.CarPark.Car_park_info.map((item: any) => {
          return new SearchItem(
            item.$.ID,
            item.$.name,
            item.$.CP_EName,
            item.$.CP_PName,
            item.$.Car_CNT,
            item.$.MB_CNT,
            item.$.maintenance,
            item.$.time,
            meta[item.$.ID] ? meta[item.$.ID].districtCht : '',
            meta[item.$.ID] ? meta[item.$.ID].districtEng : '',
            meta[item.$.ID] ? meta[item.$.ID].districtPor : ''
          );
        });
        this.lotsCache.items = items;
        this.lotsCache.updatedAt = Date.now();
        return items;
      }),
      catchError((err: any) => {
        throw '未能下載資料!';
      })
    );
  }

  private compareFn(sortParam?: string) {
    const opts: { [key: string]: { sortKey: string; sortOrder: number } } = {
      name_asc: { sortKey: 'nameCht', sortOrder: 1 },
      name_desc: { sortKey: 'nameCht', sortOrder: -1 },
      car_asc: { sortKey: 'car', sortOrder: 1 },
      car_desc: { sortKey: 'car', sortOrder: -1 },
      mb_asc: { sortKey: 'mb', sortOrder: 1 },
      mb_desc: { sortKey: 'mb', sortOrder: -1 },
    };
    const param: { sortKey: string; sortOrder: number } =
      sortParam && -1 !== Object.keys(opts).indexOf(sortParam)
        ? opts[sortParam]
        : opts['name_asc'];
    if ('nameCht' !== param.sortKey) {
      return (a: SearchItem, b: SearchItem) => {
        const aKey: number = parseInt(a[param.sortKey as 'car' | 'mb'], 10);
        const bKey: number = parseInt(b[param.sortKey as 'car' | 'mb'], 10);
        return isNaN(aKey)
          ? -1 * param.sortOrder
          : isNaN(bKey)
          ? param.sortOrder
          : aKey > bKey
          ? param.sortOrder
          : -1 * param.sortOrder;
      };
    }
    return (a: SearchItem, b: SearchItem) => {
      const aKey: string = a.nameCht;
      const bKey: string = b.nameCht;
      return aKey === bKey
        ? 0
        : aKey > bKey
        ? param.sortOrder
        : -1 * param.sortOrder;
    };
  }

  search(term: string, sortParam?: string): Observable<SearchItem[]> {
    return this.fetchLotsIfNeeded().pipe(
      map(items => {
        return items
          .filter((item: SearchItem) => {
            const termTrimmed = term.replace(/(^\s+)|(\s+$)/g, '');
            if (termTrimmed) {
              return (
                (-1 !== item.nameCht.indexOf(termTrimmed) ||
                  -1 !== item.districtCht.indexOf(termTrimmed)) &&
                '0' === item.inMaintenance
              );
            }
            return '0' === item.inMaintenance;
          })
          .sort(this.compareFn(sortParam));
      })
    );
  }
}
