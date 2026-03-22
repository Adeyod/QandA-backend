import { Types } from 'mongoose';
import { Plan } from 'src/modules/users/schemas/user.schema';

export interface JwtUser {
  _id: Types.ObjectId;
  email: string;
  role: string;
  plans: Plan[];
}
