import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './services/simulation.service';
import { SimulationCalculatorService } from './services/simulation-calculator.service';
import { Simulation } from './entities/simulation.entity';
import { SequelizeSimulationRepository } from './repositories/sequelize-simulation.repository';
import { SIMULATION_REPOSITORY } from './decorators/inject-simulation-repository.decorator';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Simulation]),
    forwardRef(() => UsersModule),
  ],
  controllers: [SimulationController],
  providers: [
    SimulationService,
    SimulationCalculatorService,
    {
      provide: SIMULATION_REPOSITORY,
      useClass: SequelizeSimulationRepository,
    },
  ],
  exports: [
    SimulationService,
    SimulationCalculatorService,
    SIMULATION_REPOSITORY,
    SequelizeModule,
  ],
})
export class SimulationModule {}