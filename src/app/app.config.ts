import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';
import {
  CategoryScale,
  Decimation,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  TimeScale,
  Title,
  Tooltip
} from 'chart.js';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideCharts(withDefaultRegisterables(), {
      registerables: [
        LineController,
        LineElement,
        PointElement,
        LinearScale,
        TimeScale,
        Title,
        Tooltip,
        Legend,
        Filler,
        CategoryScale,
        Decimation,
      ],
    }),
  ],
};
