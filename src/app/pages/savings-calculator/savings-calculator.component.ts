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
          label: (context) => {
            const datasetLabel = context.dataset.label || '';
            const value = context.formattedValue;
            return `${datasetLabel}: $${value}`;
          },
        },
      },
      decimation: {
        enabled: true,
        algorithm: 'lttb',
        threshold: 200,
        samples: 200, // target number of points visible
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
      expenses: this.fb.array([], [Validators.required]),
    });
  }

  buildChart() {
    this.form.markAllAsTouched();
    this.incomes.controls.forEach((control) => control.markAllAsTouched());
    if (this.form.invalid) return;

    const dataPoints = this.generateWeeklySavingsProjection();

    this.lineChartData = {
      datasets: dataPoints,
    };
  }

  form!: FormGroup;

  get incomes(): FormArray {
    return this.form.get('incomes') as FormArray;
  }

  get incomeFormGroups(): FormGroup[] {
    return this.incomes.controls as FormGroup[];
  }

  get expenses(): FormArray {
    return this.form.get('expenses') as FormArray;
  }

  get expensesFormGroups(): FormGroup[] {
    return this.expenses.controls as FormGroup[];
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
        isActive: true,
        interestRate: [0, [Validators.min(0)]],
        interestRateFrequency: ['yearly'],
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

  addExpense() {
    this.expenses.push(
      this.fb.group({
        id: crypto.randomUUID(),
        name: [null, [Validators.required, Validators.maxLength(100)]],
        amount: [null, [Validators.required, Validators.min(0)]],
        frequency: ['fortnightly'],
        taxRate: [0],
        applyTax: false,
        isActive: true,
        interestRate: [0, [Validators.min(0)]],
        interestRateFrequency: ['yearly'],
      })
    );
  }

  removeExpense(id: string) {
    const index = this.expenses.controls.findIndex(
      (control) => control.get('id')?.value === id
    );

    if (index !== -1) {
      this.expenses.removeAt(index);
    }
  }

  generateWeeklySavingsProjection(): ChartDataset[] {
    const incomes = this.incomes.controls
      .filter((control) => control.value.isActive)
      .map((control, index) => {
        const value = control.value;
        const taxMultiplier = value.applyTax ? 1 - value.taxRate / 100 : 1;
        const weeklyMultiplier = this.getWeeklyFrequencyMultiplier(
          value.frequency
        );
        return {
          label: value.name || `Income ${index + 1}`,
          amountPerWeek: value.amount * weeklyMultiplier * taxMultiplier,
          interestRate:
            (this.getWeeklyFrequencyMultiplier(value.interestRateFrequency) *
              value.interestRate) /
            100,
        };
      });

    const expenses = this.expenses.controls
      .filter((control) => control.value.isActive)
      .map((control, index) => {
        const value = control.value;
        const taxMultiplier = value.applyTax ? 1 - value.taxRate / 100 : 1;
        const weeklyMultiplier = this.getWeeklyFrequencyMultiplier(
          value.frequency
        );
        return {
          label: value.name || `Income ${index + 1}`,
          amountPerWeek: value.amount * weeklyMultiplier * taxMultiplier * -1,
          interestRate:
            (this.getWeeklyFrequencyMultiplier(value.interestRateFrequency) *
              value.interestRate) /
            100,
        };
      });

    const goal = this.form.get('savingsGoal')?.value || 0;

    let currentDate = new Date(); // Start from the current date

    const points: { x: number; y: number }[] = [
      { x: currentDate.getTime(), y: 0 },
    ];

    let totalSavings = 0;
    const datasets: ChartDataset[] = [];

    const incomeData: DataPoint[][] = incomes.map(() => [
      { x: currentDate.getTime(), y: 0 },
    ]);

    const expenseData: DataPoint[][] = expenses.map(() => [
      { x: currentDate.getTime(), y: 0 },
    ]);

    while (totalSavings < goal && points.length < 20000) {
      currentDate.setDate(currentDate.getDate() + 7); // Increment by 1 week

      let weeklyIncome = 0;
      let weeklyExpense = 0;

      incomes.forEach((income, i) => {
        const lastValue = incomeData[i][incomeData[i].length - 1].y;
        const newValue =
          (lastValue + income.amountPerWeek) * (1 + income.interestRate);
        weeklyIncome += newValue;
        incomeData[i].push({
          x: currentDate.getTime(),
          y: newValue,
        });
      });

      expenses.forEach((expense, i) => {
        const lastValue = expenseData[i][expenseData[i].length - 1].y;
        const newValue =
          (lastValue + expense.amountPerWeek) * (1 + expense.interestRate);
        weeklyExpense += newValue;
        expenseData[i].push({
          x: currentDate.getTime(),
          y: newValue,
        });
      });

      totalSavings = weeklyIncome + weeklyExpense;
      
      points.push({
        x: currentDate.getTime(),
        y: totalSavings,
      }); // Push the actual date
    }
    // PUSH COMBINED CALCULATION LINE (TOTAL NET INCOME)
    datasets.push({
      label: 'Total Savings ($)',
      data: points,
      fill: false,
      borderColor: 'black',
      tension: 0.3,
      indexAxis: 'x',
      parsing: false,
      type: 'line',
      pointRadius: 6,
    });

    // PUSH ALL INCOMES
    incomes.forEach((income, i) => {
      const color = this.getRandomGreenColor();
      datasets.push({
        label: income.label,
        data: incomeData[i],
        borderColor: color[0],
        fill: true,
        backgroundColor: color[1],
        radius: 3,
      });
    });

    // PUSH ALL EXPENSES
    expenses.forEach((income, i) => {
      const color = this.getRandomRedColor();
      datasets.push({
        label: income.label,
        data: expenseData[i],
        borderColor: color[0],
        fill: true,
        backgroundColor: color[1],
        radius: 3,
      });
    });

    return datasets;
  }
  private getRandomGreenColor(): [string, string] {
    const g = Math.floor(Math.random() * 100) + 156; // 100–255 for strong green
    const r = Math.floor(Math.random() * 60); // 0–39
    const b = Math.floor(Math.random() * 60); // 0–39
    return [`rgb(${r}, ${g}, ${b})`, `rgb(${r}, ${g}, ${b}, 0.5)`];
  }

  private getRandomRedColor(): [string, string] {
    const r = Math.floor(Math.random() * 100) + 156; // 100–255 for strong red
    const g = Math.floor(Math.random() * 60); // 0–39
    const b = Math.floor(Math.random() * 60); // 0–39
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
