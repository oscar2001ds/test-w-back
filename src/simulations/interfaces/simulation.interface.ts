
export interface SimulationStats {
  totalSimulations: number;
  activeSimulations: number;
  completedSimulations: number;
  pausedSimulations: number;
  totalInvested: number;
  totalProjectedReturns: number;
  averageReturnRate: number;
  userActiveDays: number;
  lastSimulationDate: string | undefined;
}