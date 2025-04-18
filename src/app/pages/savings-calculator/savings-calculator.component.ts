import { Component, OnInit } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AmountFrequencyTaxInputComponent } from '../../components/amount-frequency-tax-input/amount-frequency-tax-input.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartDataset, ChartOptions } from 'chart.js';

type DataPoint = { x: number; y: number };

@Component({
  selector: 'app-savings-calculator',
  imports: [
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatSlideToggleModule,
    AmountFrequencyTaxInputComponent,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    BaseChartDirective,
  ],
  templateUrl: './savings-calculator.component.html',
  styleUrl: './savings-calculator.component.scss',
})
export class SavingsCalculatorComponent implements OnInit {
  // CHARTJS STUFF
  lineChartData: { datasets: ChartDataset[] } = {
    datasets: [],
  };

  lineChartOptions: ChartOptions = {
    responsive: true,
    parsing: false,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Savings Growth Over Time',
      },
      tooltip: {
        callbacks: {
          label: (context) => `$${context.parsed.y.toFixed(2)}`,
        },
      },
      decimation: {
        enabled: true,
        algorithm: 'lttb',
        threshold: 100,
        samples: 50, // target number of points visible
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Total Savings ($)',
        },
        beginAtZero: true,
        type: 'linear',
      },
      x: {
        title: {
          display: true,
          text: 'Week',
        },
        type: 'time',
        time: {
          unit: 'week',
          tooltipFormat: 'll',
        },
        ticks: {
          source: 'auto',
          autoSkip: true,
        },
      },
    },
  };

  ngOnInit() {
    this.form = this.fb.group({
      savingsGoal: [null, [Validators.required, Validators.min(0)]],
      incomes: this.fb.array([], [Validators.required]),
    });
  }

  buildChart() {
    this.form.markAllAsTouched();
    this.incomes.controls.forEach((control) => control.markAllAsTouched());
    if (this.form.invalid) return;

    const dataPoints = this.generateWeeklySavingsProjection();
    const otherData = this.generateIndividualIncomeProjections();

    this.lineChartData = {
      datasets: [
        {
          label: 'Total Savings ($)',
          data: dataPoints,
          fill: false,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.3,
          indexAxis: 'x',
          parsing: false,
          type: 'line',
        },
        ...otherData,
      ],
    };
  }

  form!: FormGroup;

  get incomes(): FormArray {
    return this.form.get('incomes') as FormArray;
  }

  get incomeFormGroups(): FormGroup[] {
    return this.incomes.controls as FormGroup[];
  }

  constructor(private fb: FormBuilder) {}

  addIncome() {
    this.incomes.push(
      this.fb.group({
        id: crypto.randomUUID(),
        name: [null, [Validators.required, Validators.maxLength(100)]],
        amount: [null, [Validators.required, Validators.min(0)]],
        frequency: ['fortnightly'],
        taxRate: [0],
        applyTax: false,
      })
    );
  }

  removeIncome(id: string) {
    const index = this.incomes.controls.findIndex(
      (control) => control.get('id')?.value === id
    );

    if (index !== -1) {
      this.incomes.removeAt(index);
    }
  }

  generateWeeklySavingsProjection(): { x: number; y: number }[] {
    const incomes = this.incomes.controls.map((control) => {
      const value = control.value;
      const taxMultiplier = value.applyTax ? 1 - value.taxRate / 100 : 1;
      const weeklyMultiplier = this.getWeeklyFrequencyMultiplier(
        value.frequency
      );
      return {
        amountPerWeek: value.amount * weeklyMultiplier * taxMultiplier,
      };
    });

    const goal = this.form.get('savingsGoal')?.value || 0;
    const points: { x: number; y: number }[] = [];

    let totalSavings = 0;
    let currentDate = new Date(); // Start from the current date

    while (totalSavings < goal && points.length < 20000) {
      const weeklyIncome = incomes.reduce(
        (sum, inc) => sum + inc.amountPerWeek,
        0
      );
      totalSavings += weeklyIncome;

      points.push({
        x: currentDate.getTime(),
        y: totalSavings,
      }); // Push the actual date
      currentDate.setDate(currentDate.getDate() + 7); // Increment by 1 week
    }
    console.log(points);

    return points;
  }

  generateIndividualIncomeProjections(): ChartDataset[] {
    const incomes = this.incomes.controls.map((control, index) => {
      const value = control.value;
      const taxMultiplier = value.applyTax ? 1 - value.taxRate / 100 : 1;
      const weeklyMultiplier = this.getWeeklyFrequencyMultiplier(
        value.frequency
      );
      return {
        label: value.name || `Income ${index + 1}`,
        amountPerWeek: value.amount * weeklyMultiplier * taxMultiplier,
      };
    });

    const goal = this.form.get('savingsGoal')?.value || 0;
    const datasets: ChartDataset[] = [];

    let currentDate = new Date();
    let totalSavings = 0;

    // Initialize data arrays for each income
    const incomeData: DataPoint[][] = incomes.map(() => []);

    while (totalSavings < goal && incomeData[0].length < 20000) {
      incomes.forEach((income, i) => {
        const lastValue =
          incomeData[i].length > 0
            ? incomeData[i][incomeData[i].length - 1].y
            : 0;
        const newValue = lastValue + income.amountPerWeek;

        incomeData[i].push({
          x: currentDate.getTime(),
          y: newValue,
        });
      });

      totalSavings = incomeData.reduce(
        (sum, data) => sum + data[data.length - 1].y,
        0
      );
      currentDate.setDate(currentDate.getDate() + 7);
    }

    // Build final datasets array
    incomes.forEach((income, i) => {
      const color = this.getRandomColor();
      datasets.push({
        label: income.label,
        data: incomeData[i],
        borderColor: color[0],
        fill: true,
        backgroundColor: color[1],
        radius: 0,
      });
    });

    return datasets;
  }
  private getRandomColor(): [string, string] {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return [`rgb(${r}, ${g}, ${b})`, `rgb(${r}, ${g}, ${b}, 0.5)`];
  }
  private getWeeklyFrequencyMultiplier(frequency: string): number {
    switch (frequency.toLowerCase()) {
      case 'weekly':
        return 1;
      case 'fortnightly':
        return 0.5;
      case 'monthly':
        return 12 / 52; // ≈ 0.23077
      case 'yearly':
        return 1 / 52; // ≈ 0.01923
      default:
        return 0;
    }
  }
}
