import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { SearchService } from './search.service';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HttpClientModule, ReactiveFormsModule],
  providers: [SearchService],
  bootstrap: [AppComponent],
})
export class AppModule {}
