import { Injectable, Logger } from '@nestjs/common';
import { PaymentMethod } from '../entities/simulation.entity';

interface InterestRateTier {
  minMonths: number;
  maxMonths: number;
  annualRate: number;
}

@Injectable()
export class SimulationCalculatorService {
  private readonly logger = new Logger(SimulationCalculatorService.name);

  // Tabla de tasas de interés del Banco W según el plazo
  private readonly interestRateTiers: InterestRateTier[] = [
    { minMonths: 1, maxMonths: 6, annualRate: 0.08 },      // 8% anual para 1-6 meses
    { minMonths: 7, maxMonths: 12, annualRate: 0.095 },    // 9.5% anual para 7-12 meses
    { minMonths: 13, maxMonths: 24, annualRate: 0.11 },    // 11% anual para 13-24 meses
    { minMonths: 25, maxMonths: 36, annualRate: 0.125 },   // 12.5% anual para 25-36 meses
    { minMonths: 37, maxMonths: 60, annualRate: 0.14 },    // 14% anual para 37-60 meses (5 años)
    { minMonths: 61, maxMonths: 120, annualRate: 0.155 },  // 15.5% anual para 61-120 meses (10 años)
    { minMonths: 121, maxMonths: 600, annualRate: 0.17 },  // 17% anual para más de 10 años
  ];

  /**
   * Calcula el número de meses entre dos fechas
   */
  calculateTermMonths(startDate: string | Date, endDate: string | Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    const dayDiff = end.getDate() - start.getDate();
    
    let totalMonths = yearDiff * 12 + monthDiff;
    
    // Si el día final es menor que el inicial, resta un mes
    if (dayDiff < 0) {
      totalMonths--;
    }
    
    return Math.max(1, totalMonths); // Mínimo 1 mes
  }

  /**
   * Obtiene la tasa de interés anual según el plazo en meses
   */
  getInterestRateByPeriod(termMonths: number): number {
    const tier = this.interestRateTiers.find(
      tier => termMonths >= tier.minMonths && termMonths <= tier.maxMonths
    );
    
    if (!tier) {
      this.logger.warn(`No se encontró tier para ${termMonths} meses, usando tasa por defecto`);
      return 0.10; // 10% por defecto
    }
    
    return tier.annualRate;
  }

  /**
   * Calcula la tasa de retorno según las fechas y monto
   */
  calculateReturnRate(
    startDate: string | Date, 
    endDate: string | Date, 
    amount: number,
    paymentMethod: PaymentMethod = PaymentMethod.MONTHLY
  ): number {
    const termMonths = this.calculateTermMonths(startDate, endDate);
    let baseRate = this.getInterestRateByPeriod(termMonths);
    
    // Bonificación por monto alto
    if (amount >= 100000000) { // $100M+
      baseRate += 0.005; // +0.5%
    } else if (amount >= 50000000) { // $50M+
      baseRate += 0.003; // +0.3%
    } else if (amount >= 10000000) { // $10M+
      baseRate += 0.001; // +0.1%
    }
    
    // Penalización por plazo muy corto
    if (termMonths < 6) {
      baseRate -= 0.01; // -1%
    }
    
    // Ajuste por método de pago
    if (paymentMethod === PaymentMethod.ANNUAL) {
      baseRate += 0.005; // +0.5% por pago anual
    }
    
    // Asegurar que la tasa esté en un rango razonable
    return Math.max(0.05, Math.min(0.25, baseRate)); // Entre 5% y 25%
  }

  /**
   * Valida que el rango de fechas sea correcto
   */
  validateDateRange(startDate: string | Date, endDate: string | Date): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Limpiar horas para comparación solo por fecha
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    // Validar fechas válidas
    if (isNaN(start.getTime())) {
      errors.push('La fecha de inicio no es válida');
    }
    
    if (isNaN(end.getTime())) {
      errors.push('La fecha de fin no es válida');
    }
    
    if (errors.length > 0) {
      return { isValid: false, errors };
    }
    
    // La fecha de fin debe ser posterior a la de inicio
    if (end <= start) {
      errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
    }
    
    // Calcular duración
    const termMonths = this.calculateTermMonths(start, end);
    
    // Período mínimo de 1 mes
    if (termMonths < 1) {
      errors.push('El período mínimo de inversión es de 1 mes');
    }
    
    // Período máximo de 50 años (600 meses)
    if (termMonths > 600) {
      errors.push('El período máximo de inversión es de 50 años');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calcula el valor futuro de una inversión
   */
  calculateFutureValue(
    principal: number,
    annualRate: number,
    termMonths: number,
    paymentMethod: PaymentMethod
  ): number {
    const periodsPerYear = paymentMethod === PaymentMethod.MONTHLY ? 12 : 1;
    const totalPeriods = paymentMethod === PaymentMethod.MONTHLY ? termMonths : Math.floor(termMonths / 12);
    const periodRate = annualRate / periodsPerYear;
    
    // Fórmula de interés compuesto: FV = PV * (1 + r)^n
    return principal * Math.pow(1 + periodRate, totalPeriods);
  }

  /**
   * Calcula la cuota periódica para alcanzar un objetivo
   */
  calculatePeriodicPayment(
    futureValue: number,
    annualRate: number,
    termMonths: number,
    paymentMethod: PaymentMethod
  ): number {
    const periodsPerYear = paymentMethod === PaymentMethod.MONTHLY ? 12 : 1;
    const totalPeriods = paymentMethod === PaymentMethod.MONTHLY ? termMonths : Math.floor(termMonths / 12);
    const periodRate = annualRate / periodsPerYear;
    
    if (periodRate === 0) {
      return futureValue / totalPeriods;
    }
    
    // Fórmula de anualidad: PMT = FV * r / ((1 + r)^n - 1)
    return futureValue * periodRate / (Math.pow(1 + periodRate, totalPeriods) - 1);
  }

  /**
   * Genera un cronograma de pagos
   */
  generatePaymentSchedule(
    principal: number,
    annualRate: number,
    termMonths: number,
    paymentMethod: PaymentMethod,
    startDate: Date
  ): Array<{
    period: number;
    date: string;
    balance: number;
    interest: number;
    totalValue: number;
  }> {
    const schedule: Array<{
      period: number;
      date: string;
      balance: number;
      interest: number;
      totalValue: number;
    }> = [];
    
    const periodsPerYear = paymentMethod === PaymentMethod.MONTHLY ? 12 : 1;
    const periodRate = annualRate / periodsPerYear;
    const monthsPerPeriod = paymentMethod === PaymentMethod.MONTHLY ? 1 : 12;
    const totalPeriods = Math.floor(termMonths / monthsPerPeriod);
    
    let currentBalance = principal;
    const currentDate = new Date(startDate);
    
    for (let period = 1; period <= totalPeriods; period++) {
      // Calcular interés del período
      const periodInterest = currentBalance * periodRate;
      
      // Actualizar balance
      currentBalance += periodInterest;
      
      // Avanzar fecha
      if (paymentMethod === PaymentMethod.MONTHLY) {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      }
      
      schedule.push({
        period,
        date: currentDate.toISOString().split('T')[0],
        balance: currentBalance,
        interest: periodInterest,
        totalValue: currentBalance
      });
    }
    
    return schedule;
  }

  /**
   * Calcula estadísticas resumidas de una simulación
   */
  calculateSimulationStats(
    amount: number,
    returnRate: number,
    termMonths: number,
    paymentMethod: PaymentMethod
  ): {
    finalAmount: number;
    totalReturn: number;
    monthlyReturn: number;
    annualizedReturn: number;
    effectiveRate: number;
  } {
    const finalAmount = this.calculateFutureValue(amount, returnRate, termMonths, paymentMethod);
    const totalReturn = finalAmount - amount;
    const monthlyReturn = totalReturn / termMonths;
    
    // Tasa anualizada efectiva
    const years = termMonths / 12;
    const annualizedReturn = Math.pow(finalAmount / amount, 1 / years) - 1;
    
    return {
      finalAmount: Math.round(finalAmount),
      totalReturn: Math.round(totalReturn),
      monthlyReturn: Math.round(monthlyReturn),
      annualizedReturn: Number(annualizedReturn.toFixed(4)),
      effectiveRate: returnRate
    };
  }
}