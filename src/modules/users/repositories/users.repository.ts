import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { generateRefCode } from '../../../common/utils/helper';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}

  async findById(id: Types.ObjectId) {
    return this.userModel.findById(id);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({
      email,
    });
    return user;
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    let refCode: string;
    let exists = true;

    do {
      const code = generateRefCode();
      refCode = code;
      const existing = await this.userModel.exists({
        referralCode: refCode.trim().toLowerCase(),
      });
      exists = !!existing;
    } while (exists);

    data.referralCode = refCode;

    const user = new this.userModel(data);
    await user.save();

    console.log('refCode:', refCode);
    console.log('Created user:', user);
    return user;
  }

  async update(
    id: Types.ObjectId,
    data: Partial<User>,
  ): Promise<UserDocument | null> {
    return await this.userModel.findByIdAndUpdate(id, data, { new: true });
  }
}
