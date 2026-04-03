import { Types } from 'mongoose';
import { Plan } from '../../modules/users/schemas/user.schema';

export interface JwtUser {
  sub: Types.ObjectId;
  email: string;
  role: string;
  plans: Plan[];
}
