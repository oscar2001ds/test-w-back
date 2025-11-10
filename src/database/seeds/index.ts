import { CreationAttributes, Model, ModelStatic } from "sequelize";
import { User } from "../models";
import userJson from './user.seed.json';

export const seeds: Array<{
  model: ModelStatic<Model>;
  data: CreationAttributes<Model>[];
}> = [
  {
    model: User,
    data: userJson,
  },
];