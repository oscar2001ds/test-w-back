import { CreationAttributes, Model, ModelStatic } from "sequelize";
import { User, Simulation } from "../models";
import userJson from './user.seed.json';
import simulationJson from './simulation.seed.json';

export const seeds: Array<{
  model: ModelStatic<Model>;
  data: CreationAttributes<Model>[];
}> = [
  {
    model: User,
    data: userJson,
  },
  {
    model: Simulation,
    data: simulationJson,
  },
];