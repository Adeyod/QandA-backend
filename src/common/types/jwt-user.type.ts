import { Types } from 'mongoose';

export interface JwtUser {
  _id: Types.ObjectId;
  email: string;
  role: string;
}
