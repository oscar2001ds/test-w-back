import { Inject } from '@nestjs/common';

// Token symbol para evitar colisiones
export const SIMULATION_REPOSITORY = Symbol('SIMULATION_REPOSITORY');

// Decorator personalizado para inyección del repository
export const InjectSimulationRepository = () => Inject(SIMULATION_REPOSITORY);