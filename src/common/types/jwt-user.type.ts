import { Types } from 'mongoose';
import { Plan } from 'src/modules/users/schemas/user.schema';

export interface JwtUser {
  sub: Types.ObjectId;
  email: string;
  role: string;
  plans: Plan[];
}
