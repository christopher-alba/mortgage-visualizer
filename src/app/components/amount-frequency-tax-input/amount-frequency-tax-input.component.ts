import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-amount-frequency-tax-input',
  imports: [
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    CommonModule,
    MatButtonModule,
  ],
  templateUrl: './amount-frequency-tax-input.component.html',
  styleUrl: './amount-frequency-tax-input.component.scss',
})
export class AmountFrequencyTaxInputComponent implements OnInit {
  @Input() formGroup!: FormGroup;
  @Input() amountType!: 'income' | 'expense';
  @Output() deleteAmountInput = new EventEmitter<string>();
  ngOnInit(): void {}
  onDelete() {
    this.deleteAmountInput.emit(this.formGroup.controls['id'].value);
  }
}
