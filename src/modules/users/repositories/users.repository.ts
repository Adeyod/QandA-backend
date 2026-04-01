import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { generateRefCode } from '../../../common/utils/helper';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel('User') private userModel: Model<UserDocument>) {}

  async findById(id: Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({
      email,
    });
    return user;
  }

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    referredBy: string | undefined;
  }): Promise<UserDocument> {
    let refCode: string;
    let exists = true;
    let referralChain: { userId: Types.ObjectId; level: number }[] = [];

    do {
      const code = generateRefCode();
      refCode = code;
      const existing = await this.userModel.exists({
        referralCode: refCode.trim().toLowerCase(),
      });
      exists = !!existing;
    } while (exists);

    const referralCode = refCode;

    let referredById: Types.ObjectId | null = null;

    if (data.referredBy) {
      const parent = await this.userModel.findOne({
        referralCode: data.referredBy,
      });

      if (parent) {
        referredById = parent?._id;
      }

      if (parent) {
        const parentChain = parent.referralChain || [];

        referralChain = [
          { userId: parent._id, level: 1 },
          ...parentChain.slice(0, 2).map((item) => ({
            userId: item.userId,
            level: item.level + 1,
          })),
        ];
      }
    }

    const user = new this.userModel({
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      email: data.email,
      phoneNumber: data.phoneNumber,
      referralCode: referralCode,
      referredBy: referredById || null,
      referralChain: referralChain,
    });
    await user.save();

    return user;
  }

  async update(
    id: Types.ObjectId,
    data: Partial<User>,
  ): Promise<UserDocument | null> {
    return await this.userModel.findByIdAndUpdate(id, data, {
      returnDocument: 'after',
    });
  }

  async queryAllReferredBy(userId: Types.ObjectId) {
    const referrals = await this.userModel.aggregate([
      {
        $match: { _id: userId },
      },
      {
        $graphLookup: {
          from: 'users',
          startWith: '$referredBy',
          connectFromField: 'referredBy',
          connectToField: '_id',
          as: 'referralChain',
          maxDepth: 2,
          depthField: 'level',
        },
      },
    ]);

    console.log('referrals:', referrals);
    return referrals;
  }
}
